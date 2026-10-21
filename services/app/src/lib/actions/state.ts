"use server";

import prisma from "@/lib/db";
import { publishChange } from "@/lib/realtime/hub";
import { revalidatePath } from "next/cache";
import { completedAtFor } from "@/lib/status";
import { emitWebhook } from "@/lib/webhooks/deliver";
import { createNotifications, displayName, pushNotifications, watcherIds } from "./notify";
import { statusMeta } from "@/lib/statusMeta";
import { requireProjectAccess, logHistoryEvent, propagateStatusUpwards, assertNodeStatus } from "./helpers";

export async function updateNodeStatus(projectId: string, id: string, status: string) {
  const userId = await requireProjectAccess(projectId);
  assertNodeStatus(status);
  const pushIds: string[] = [];
  let moved: { title: string; from: string } | null = null;

  await prisma.$transaction(async (tx) => {
    const oldNode = await tx.node.findFirst({ where: { id, projectId } });
    if (!oldNode) throw new Error("Node not found");
    if (oldNode.status === status) return;
    moved = { title: oldNode.title, from: oldNode.status };

    await tx.node.update({ where: { id }, data: { status, completedAt: completedAtFor(oldNode.status, status) } });
    await propagateStatusUpwards(projectId, id, userId, tx);
    await logHistoryEvent({ projectId, nodeId: id, action: 'STATUS_CHANGE', entityType: 'NODE', entityName: oldNode.title, oldValue: oldNode.status, newValue: status, userId }, tx);
    const watchers = await watcherIds(tx, id);
    if (watchers.some((w) => w !== userId)) {
      pushIds.push(...await createNotifications(tx, { projectId, nodeId: id, actorId: userId, type: "STATUS", recipients: watchers, title: `${await displayName(tx, userId)} moved “${oldNode.title}” to ${statusMeta(status).label}` }));
    }
  });
  pushNotifications(pushIds);

  revalidatePath(`/project/${projectId}/board`);
  revalidatePath(`/project/${projectId}/backlog`);
  publishChange(projectId, "nodes", userId, id);
  if (moved) emitWebhook(projectId, "item.status_changed", { actorId: userId, item: { id, title: (moved as { title: string }).title, status }, from: (moved as { from: string }).from, to: status });
}
