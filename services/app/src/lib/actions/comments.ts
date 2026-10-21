"use server";

import prisma from "@/lib/db";
import { publishChange } from "@/lib/realtime/hub";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/lib/utils";
import { emitWebhook } from "@/lib/webhooks/deliver";
import { UserError, getProjectAccess, requireProjectAccess, toResult, type ActionResult } from "./helpers";
import { extractMentionIds, plainText } from "@/lib/mentions";
import { addWatchers, createNotifications, displayName, participantIds, pushNotifications, watcherIds } from "./notify";

const MAX_COMMENT_LENGTH = 4000;

export type CommentInfo = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null };
  canDelete: boolean;
};

export async function getComments(projectId: string, nodeId: string): Promise<CommentInfo[]> {
  const access = await getProjectAccess(projectId);
  if (!access) return [];
  const comments = await prisma.comment.findMany({
    where: { nodeId, node: { projectId } },
    orderBy: { createdAt: "asc" },
    take: 500,
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });
  return serializeData(
    comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt as unknown as string,
      user: c.user,
      canDelete: c.userId === access.userId || access.role === "OWNER",
    }))
  );
}

/** Viewers may comment too; only archived projects are closed to it. */
export async function addComment(projectId: string, nodeId: string, body: string): Promise<ActionResult> {
  const userId = await requireProjectAccess(projectId, { mode: "comment" });
  let created: { id: string; title: string; body: string } | null = null;
  const result = await toResult(async () => {
    const text = typeof body === "string" ? body.trim() : "";
    if (!text) throw new UserError("Write something first");
    if (text.length > MAX_COMMENT_LENGTH) throw new UserError(`Comments can be at most ${MAX_COMMENT_LENGTH} characters`);
    const node = await prisma.node.findFirst({ where: { id: nodeId, projectId }, select: { id: true, title: true } });
    if (!node) throw new UserError("This item no longer exists");
    const comment = await prisma.comment.create({ data: { nodeId, userId, body: text } });
    created = { id: comment.id, title: node.title, body: text };

    // Mentions notify the people named; everyone else watching the item gets a plain "commented" notification.
    const mentioned = (await participantIds(prisma, projectId, extractMentionIds(text))).filter((id) => id !== userId);
    await addWatchers(prisma, nodeId, [userId, ...mentioned]);
    const actor = await displayName(prisma, userId);
    const snippet = plainText(text).replace(/\s+/g, " ").slice(0, 90);
    const pushed = [
      ...(await createNotifications(prisma, { projectId, nodeId, actorId: userId, type: "MENTION", recipients: mentioned, title: `${actor} mentioned you on “${node.title}”: ${snippet}` })),
      ...(await createNotifications(prisma, {
        projectId, nodeId, actorId: userId, type: "COMMENT",
        recipients: (await watcherIds(prisma, nodeId)).filter((id) => !mentioned.includes(id)),
        title: `${actor} commented on “${node.title}”: ${snippet}`,
      })),
    ];
    pushNotifications(pushed);
  });
  if (!result.error) {
    revalidatePath(`/project/${projectId}/board`);
    revalidatePath(`/project/${projectId}/backlog`);
    publishChange(projectId, "comments", userId, nodeId);
    if (created) emitWebhook(projectId, "comment.created", { actorId: userId, item: { id: nodeId, title: (created as { title: string }).title }, comment: { id: (created as { id: string }).id, body: plainText((created as { body: string }).body) } });
  }
  return result;
}

export async function deleteComment(projectId: string, commentId: string): Promise<ActionResult> {
  const access = await getProjectAccess(projectId);
  if (!access) return { error: "Project not found" };
  const comment = await prisma.comment.findFirst({ where: { id: commentId, node: { projectId } }, select: { id: true, userId: true } });
  if (!comment) return {};
  if (comment.userId !== access.userId && access.role !== "OWNER") return { error: "You can only delete your own comments" };
  const removed = await prisma.comment.delete({ where: { id: commentId }, select: { nodeId: true } });
  revalidatePath(`/project/${projectId}/board`);
  revalidatePath(`/project/${projectId}/backlog`);
  publishChange(projectId, "comments", access.userId, removed.nodeId);
  return {};
}
