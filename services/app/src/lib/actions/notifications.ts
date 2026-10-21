"use server";

import prisma from "@/lib/db";
import { serializeData } from "@/lib/utils";
import { getProjectAccess, requireUserId, requireProjectAccess } from "./helpers";
import { addWatchers } from "./notify";

export type NotificationInfo = {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  read: boolean;
  projectId: string | null;
  projectName: string | null;
  nodeId: string | null;
};

/** The signed-in person's latest notifications across every project, plus the unread count. */
export async function getNotifications(limit = 30): Promise<{ items: NotificationInfo[]; unread: number }> {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return { items: [], unread: 0 };
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 100),
      include: { project: { select: { name: true } } },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return {
    unread,
    items: serializeData(rows.map((n) => ({
      id: n.id, type: n.type, title: n.title, createdAt: n.createdAt as unknown as string,
      read: n.readAt !== null, projectId: n.projectId, projectName: n.project?.name ?? null, nodeId: n.nodeId,
    }))),
  };
}

export async function getUnreadCount(): Promise<number> {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return 0;
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationsRead(ids: string[] | "all"): Promise<void> {
  const userId = await requireUserId();
  await prisma.notification.updateMany({
    where: { userId, readAt: null, ...(ids === "all" ? {} : { id: { in: ids.slice(0, 200) } }) },
    data: { readAt: new Date() },
  });
}

/** Opening an item marks its notifications as read. */
export async function markNodeNotificationsRead(projectId: string, nodeId: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.notification.updateMany({ where: { userId, projectId, nodeId, readAt: null }, data: { readAt: new Date() } });
}

export async function isWatching(projectId: string, nodeId: string): Promise<boolean> {
  const access = await getProjectAccess(projectId);
  if (!access) return false;
  return (await prisma.nodeWatcher.count({ where: { nodeId, userId: access.userId, node: { projectId } } })) > 0;
}

/** Watching an item means you're notified about its comments and status changes. Any member may watch. */
export async function setWatching(projectId: string, nodeId: string, watch: boolean): Promise<boolean> {
  const userId = await requireProjectAccess(projectId, { mode: "read" });
  const node = await prisma.node.findFirst({ where: { id: nodeId, projectId }, select: { id: true } });
  if (!node) return false;
  if (watch) await addWatchers(prisma, nodeId, [userId]);
  else await prisma.nodeWatcher.deleteMany({ where: { nodeId, userId } });
  return watch;
}

/** Whether to get an email when someone mentions you or assigns you something while you're away. */
export async function getEmailPreference(): Promise<boolean> {
  const userId = await requireUserId().catch(() => null);
  if (!userId) return true;
  return (await prisma.user.findUnique({ where: { id: userId }, select: { emailNotifications: true } }))?.emailNotifications ?? true;
}

export async function setEmailPreference(enabled: boolean): Promise<void> {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: { emailNotifications: !!enabled } });
}
