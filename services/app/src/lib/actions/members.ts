"use server";

import prisma from "@/lib/db";
import { appBaseUrl, mailConfig } from "@/lib/mail/config";
import { inviteEmail } from "@/lib/mail/templates";
import { sendMail } from "@/lib/mail/send";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/lib/utils";
import { getHub, publishChange } from "@/lib/realtime/hub";
import { INVITABLE_ROLES, isInvitableRole, normalizeEmail, type ProjectRole } from "@/lib/roles";
import { UserError, getProjectAccess, logHistoryEvent, requireProjectAccess, requireUserId, toResult, type ActionResult } from "./helpers";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_PENDING_INVITES = 50;

export type MemberInfo = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: ProjectRole;
  isYou: boolean;
};

export type InviteInfo = { id: string; email: string; role: ProjectRole; token: string; createdAt: string; invitedByName: string | null };

const PERSON = { select: { id: true, name: true, email: true, image: true } } as const;

/** Everyone who can open the project (owner first). Readable by any member. */
export async function getProjectMembers(projectId: string): Promise<MemberInfo[]> {
  const access = await getProjectAccess(projectId);
  if (!access) return [];
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { user: PERSON, members: { orderBy: { createdAt: "asc" }, select: { role: true, user: PERSON } } },
  });
  if (!project) return [];
  const toInfo = (u: { id: string; name: string | null; email: string | null; image: string | null }, role: ProjectRole): MemberInfo => ({
    ...u,
    role,
    isYou: u.id === access.userId,
  });
  return serializeData([
    toInfo(project.user, "OWNER"),
    ...project.members.map((m) => toInfo(m.user, m.role === "VIEWER" ? "VIEWER" : "EDITOR")),
  ]);
}

/** Pending invites are only visible to the owner. */
export async function getPendingInvites(projectId: string): Promise<InviteInfo[]> {
  const access = await getProjectAccess(projectId);
  if (!access || access.role !== "OWNER") return [];
  const invites = await prisma.projectInvite.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: { invitedBy: { select: { name: true, email: true } } },
  });
  return serializeData(
    invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: (i.role === "VIEWER" ? "VIEWER" : "EDITOR") as ProjectRole,
      token: i.token,
      createdAt: i.createdAt as unknown as string,
      invitedByName: i.invitedBy.name || i.invitedBy.email,
    }))
  );
}

export async function inviteMember(projectId: string, email: string, role: string): Promise<ActionResult & { token?: string; emailed?: boolean }> {
  const userId = await requireProjectAccess(projectId, { mode: "owner" });
  let token: string | undefined;
  let invitedEmail = "";
  let inviteRole: "EDITOR" | "VIEWER" = "EDITOR";

  const result = await toResult(async () => {
    const normalized = normalizeEmail(email);
    if (!normalized) throw new UserError("Enter a valid email address");
    if (!isInvitableRole(role)) throw new UserError(`Choose a role: ${INVITABLE_ROLES.join(" or ").toLowerCase()}`);

    const existingUser = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true } });
    if (existingUser) {
      const alreadyIn = await prisma.project.findFirst({
        where: { id: projectId, OR: [{ userId: existingUser.id }, { members: { some: { userId: existingUser.id } } }] },
        select: { id: true },
      });
      if (alreadyIn) throw new UserError("That person is already part of this project");
    }

    const pending = await prisma.projectInvite.count({ where: { projectId } });
    if (pending >= MAX_PENDING_INVITES) throw new UserError("Too many pending invites. Remove some first.");

    const invite = await prisma.projectInvite.upsert({
      where: { projectId_email: { projectId, email: normalized } },
      create: { projectId, email: normalized, role, invitedById: userId },
      update: { role, invitedById: userId, createdAt: new Date() },
    });
    token = invite.token;
    invitedEmail = normalized;
    inviteRole = role === "VIEWER" ? "VIEWER" : "EDITOR";
  });

  // Best effort: the invite exists either way, and the owner can still copy the link.
  let emailed = false;
  if (!result.error && token && mailConfig()) {
    const [inviter, project] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
      prisma.project.findUnique({ where: { id: projectId }, select: { name: true } }),
    ]);
    const sent = await sendMail(invitedEmail, inviteEmail({ inviterName: inviter?.name || inviter?.email || "Someone", projectName: project?.name ?? "a project", role: inviteRole, url: `${appBaseUrl()}/invite/${token}` }));
    emailed = sent.sent;
  }

  if (!result.error) revalidatePath(`/project/${projectId}/settings/members`);
  return { ...result, token, emailed };
}

export async function revokeInvite(projectId: string, inviteId: string) {
  await requireProjectAccess(projectId, { mode: "owner" });
  await prisma.projectInvite.deleteMany({ where: { id: inviteId, projectId } });
  revalidatePath(`/project/${projectId}/settings/members`);
}

export async function updateMemberRole(projectId: string, memberUserId: string, role: string): Promise<ActionResult> {
  const ownerId = await requireProjectAccess(projectId, { mode: "owner" });
  if (!isInvitableRole(role)) return { error: "Invalid role" };
  const updated = await prisma.projectMember.updateMany({ where: { projectId, userId: memberUserId }, data: { role } });
  if (updated.count === 0) return { error: "That person isn't a member of this project" };
  revalidatePath(`/project/${projectId}/settings/members`);
  publishChange(projectId, "members", ownerId);
  return {};
}

/** The owner can remove anyone; any member can remove themselves (leave). */
export async function removeMember(projectId: string, memberUserId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const access = await getProjectAccess(projectId);
  if (!access) return { error: "Project not found" };
  const isSelf = memberUserId === userId;
  if (!isSelf && access.role !== "OWNER") return { error: "Only the project owner can remove people" };

  const result = await toResult(() => prisma.$transaction(async (tx) => {
    const member = await tx.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: memberUserId } },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!member) throw new UserError("The owner can't be removed. Delete or transfer the project instead.");
    await tx.projectMember.delete({ where: { id: member.id } });
    // Don't leave work assigned to someone who can no longer see it.
    await tx.node.updateMany({ where: { projectId, assigneeId: memberUserId }, data: { assigneeId: null } });
    await logHistoryEvent({
      projectId, action: "DELETE", entityType: "MEMBER", entityName: member.user.name || member.user.email || "Member",
      newValue: isSelf ? "Left the project" : "Removed", userId,
    }, tx);
  }));

  revalidatePath(`/project/${projectId}`, "layout");
  revalidatePath("/projects");
  if (!result.error) {
    // Cut the removed person's live streams right away; everyone else just refreshes the member list.
    getHub().kickUser(projectId, memberUserId);
    publishChange(projectId, "members", userId);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Accepting invites
// ---------------------------------------------------------------------------

export type InvitePreview = {
  projectName: string;
  role: ProjectRole;
  invitedBy: string | null;
  email: string;
  /** False when the invite was sent to a different email than the one signed in. */
  emailMatches: boolean;
  expired: boolean;
  alreadyMember: boolean;
  projectId: string;
};

export async function getInvitePreview(token: string): Promise<InvitePreview | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const invite = await prisma.projectInvite.findUnique({
    where: { token },
    include: { project: { select: { name: true, userId: true } }, invitedBy: { select: { name: true, email: true } } },
  });
  if (!invite) return null;
  const member = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: invite.projectId, userId } }, select: { id: true } });
  return {
    projectName: invite.project.name,
    role: invite.role === "VIEWER" ? "VIEWER" : "EDITOR",
    invitedBy: invite.invitedBy.name || invite.invitedBy.email,
    email: invite.email,
    emailMatches: normalizeEmail(session?.user?.email) === invite.email,
    expired: Date.now() - invite.createdAt.getTime() > INVITE_TTL_MS,
    alreadyMember: !!member || invite.project.userId === userId,
    projectId: invite.projectId,
  };
}

async function joinProject(invite: { id: string; projectId: string; role: string }, userId: string, userName: string) {
  await prisma.$transaction(async (tx) => {
    await tx.projectMember.upsert({
      where: { projectId_userId: { projectId: invite.projectId, userId } },
      create: { projectId: invite.projectId, userId, role: invite.role },
      update: {},
    });
    await tx.projectInvite.delete({ where: { id: invite.id } });
    await logHistoryEvent({ projectId: invite.projectId, action: "CREATE", entityType: "MEMBER", entityName: userName, newValue: `Joined as ${invite.role.toLowerCase()}`, userId }, tx);
  });
}

export async function acceptInvite(token: string): Promise<ActionResult & { projectId?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Please sign in first" };

  const invite = await prisma.projectInvite.findUnique({ where: { token }, include: { project: { select: { userId: true } } } });
  if (!invite) return { error: "This invite link is no longer valid" };
  if (Date.now() - invite.createdAt.getTime() > INVITE_TTL_MS) return { error: "This invite has expired. Ask the owner for a new one." };
  if (normalizeEmail(session?.user?.email) !== invite.email) {
    return { error: `This invite was sent to ${invite.email}. Sign in with that email to accept it.` };
  }
  if (invite.project.userId === userId) return { projectId: invite.projectId };

  await joinProject(invite, userId, session?.user?.name || session?.user?.email || "Member");
  publishChange(invite.projectId, "members", userId);
  revalidatePath("/projects");
  return { projectId: invite.projectId };
}

/** Invites sent to the signed-in user's email are accepted automatically, so shared projects just appear. */
export async function acceptPendingInvitesForUser(): Promise<number> {
  const session = await auth();
  const userId = session?.user?.id;
  const email = normalizeEmail(session?.user?.email);
  if (!userId || !email) return 0;

  const invites = await prisma.projectInvite.findMany({
    where: { email, createdAt: { gt: new Date(Date.now() - INVITE_TTL_MS) } },
    include: { project: { select: { userId: true } } },
  });
  let joined = 0;
  for (const invite of invites) {
    if (invite.project.userId === userId) {
      await prisma.projectInvite.delete({ where: { id: invite.id } });
      continue;
    }
    await joinProject(invite, userId, session?.user?.name || email);
    joined++;
  }
  return joined;
}
