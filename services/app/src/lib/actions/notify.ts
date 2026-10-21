// Notification and watcher helpers. Not a "use server" file: only imported by action modules.

import prisma from "@/lib/db";
import { getHub } from "@/lib/realtime/hub";
import { appBaseUrl, mailConfig } from "@/lib/mail/config";
import { notificationEmail } from "@/lib/mail/templates";
import { sendMail } from "@/lib/mail/send";
import type { Db } from "./helpers";

export type NotifyType = "ASSIGNED" | "MENTION" | "COMMENT" | "STATUS";

export async function displayName(db: Db, userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  return user?.name || user?.email || "Someone";
}

export async function addWatchers(db: Db, nodeId: string, userIds: string[]): Promise<void> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  await db.nodeWatcher.createMany({ data: unique.map((userId) => ({ nodeId, userId })), skipDuplicates: true });
}

export async function watcherIds(db: Db, nodeId: string): Promise<string[]> {
  return (await db.nodeWatcher.findMany({ where: { nodeId }, select: { userId: true } })).map((w) => w.userId);
}

/** People who can see the project (owner + members) out of `ids`. Used to drop mentions of strangers. */
export async function participantIds(db: Db, projectId: string, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await db.user.findMany({
    where: { id: { in: ids }, OR: [{ projects: { some: { id: projectId } } }, { memberships: { some: { projectId } } }] },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/** Create one notification per recipient (never for the person who caused it). Returns who got one. */
export async function createNotifications(
  db: Db,
  p: { projectId: string; nodeId: string | null; actorId: string; type: NotifyType; recipients: string[]; title: string }
): Promise<string[]> {
  const to = [...new Set(p.recipients)].filter((id) => id !== p.actorId);
  if (to.length === 0) return [];
  await db.notification.createMany({
    data: to.map((userId) => ({ userId, actorId: p.actorId, projectId: p.projectId, nodeId: p.nodeId, type: p.type, title: p.title.slice(0, 300) })),
  });
  return to;
}

/** Only things addressed to someone directly are worth an email; comment/status chatter stays in the bell. */
const EMAILED_TYPES: NotifyType[] = ["MENTION", "ASSIGNED"];

/** Tell the recipients' open tabs to refresh their bell, and email those who aren't looking. Call after the transaction has committed. */
export function pushNotifications(userIds: string[]): void {
  for (const id of new Set(userIds)) getHub().publishToUser(id, { type: "notification" });
  void emailRecent(userIds).catch((error) => console.error("[mail] notification emails failed:", error));
}

/** The newest unread notification of an emailed type per recipient is sent once, unless they have the project open. */
async function emailRecent(userIds: string[]): Promise<void> {
  if (!mailConfig() || userIds.length === 0) return;
  const recipients = await prisma.user.findMany({ where: { id: { in: [...new Set(userIds)] }, emailNotifications: true, email: { not: null } }, select: { id: true, email: true } });
  for (const person of recipients) {
    const note = await prisma.notification.findFirst({
      where: { userId: person.id, readAt: null, emailedAt: null, type: { in: EMAILED_TYPES } },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { name: true } } },
    });
    if (!note || !note.projectId || !person.email) continue;
    if (getHub().isUserInProject(note.projectId, person.id)) continue;
    // Claim it first so two quick events don't send the same mail twice.
    const claimed = await prisma.notification.updateMany({ where: { id: note.id, emailedAt: null }, data: { emailedAt: new Date() } });
    if (claimed.count === 0) continue;
    const url = `${appBaseUrl()}/project/${note.projectId}/backlog${note.nodeId ? `?nodeId=${note.nodeId}` : ""}`;
    await sendMail(person.email, notificationEmail({ title: note.title, projectName: note.project?.name ?? "your project", url }));
  }
}
