"use server";

import prisma from "@/lib/db";
import { emitWebhook } from "@/lib/webhooks/deliver";
import { revalidatePath } from "next/cache";
import { publishChange } from "@/lib/realtime/hub";
import {
  UserError,
  logHistoryEvent,
  reconcileParentStatuses,
  requireProjectAccess,
  toResult,
  type ActionResult,
} from "./helpers";
import { UNDO_WINDOW_MS, restoreSnapshots, snapshotNodes, type NodeSnapshot } from "./undoStore";

const MAX_BULK_DELETE = 100;

function revalidateViews(projectId: string) {
  for (const page of ["backlog", "board", "timeline", "planning"]) revalidatePath(`/project/${projectId}/${page}`);
}

export type DeleteResult = ActionResult & { undoId?: string; count?: number };

/** Delete several items at once. The result carries an `undoId` valid for ten minutes. */
export async function bulkDeleteNodes(projectId: string, ids: string[]): Promise<DeleteResult> {
  const userId = await requireProjectAccess(projectId);
  let undoId: string | undefined;
  let count = 0;
  let deleted: { id: string; title: string }[] = [];

  const result = await toResult(() => prisma.$transaction(async (tx) => {
    const unique = [...new Set(ids)];
    if (unique.length === 0) throw new UserError("Select at least one item");
    if (unique.length > MAX_BULK_DELETE) throw new UserError(`You can delete up to ${MAX_BULK_DELETE} items at once`);

    const snapshots = await snapshotNodes(tx, projectId, unique);
    if (snapshots.length === 0) return;
    count = snapshots.length;
    deleted = snapshots.map((s) => ({ id: s.node.id, title: s.node.title }));

    const parentIds = [...new Set(snapshots.flatMap((s) => s.parents))].filter((p) => !unique.includes(p));
    await tx.node.deleteMany({ where: { id: { in: snapshots.map((s) => s.node.id) }, projectId } });
    for (const s of snapshots) {
      await logHistoryEvent({ projectId, action: "DELETE", entityType: "NODE", entityName: s.node.title, userId }, tx);
    }
    await reconcileParentStatuses(projectId, parentIds, userId, tx);

    // Opportunistic cleanup of old undo snapshots.
    await tx.undoEntry.deleteMany({ where: { projectId, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
    const entry = await tx.undoEntry.create({ data: { projectId, userId, kind: "DELETE_NODE", payload: snapshots as unknown as object } });
    undoId = entry.id;
  }, { timeout: 20_000 }));

  if (!result.error) {
    revalidateViews(projectId);
    publishChange(projectId, "nodes", userId);
    for (const item of deleted.slice(0, 100)) emitWebhook(projectId, "item.deleted", { actorId: userId, item });
  }
  return { ...result, undoId, count };
}

/** Bring back items deleted by `deleteNode` / `bulkDeleteNodes`, if it was recent enough and by you. */
export async function undoDelete(projectId: string, undoId: string): Promise<ActionResult & { restored?: number }> {
  const userId = await requireProjectAccess(projectId);
  let restored = 0;
  const result = await toResult(() => prisma.$transaction(async (tx) => {
    const entry = await tx.undoEntry.findFirst({ where: { id: undoId, projectId, userId, kind: "DELETE_NODE" } });
    if (!entry) throw new UserError("There is nothing to undo any more");
    if (Date.now() - entry.createdAt.getTime() > UNDO_WINDOW_MS) throw new UserError("It's too late to undo that delete");
    restored = await restoreSnapshots(tx, projectId, entry.payload as unknown as NodeSnapshot[]);
    await tx.undoEntry.delete({ where: { id: entry.id } });
    if (restored > 0) await logHistoryEvent({ projectId, action: "RESTORE", entityType: "NODE", entityName: `${restored} item${restored === 1 ? "" : "s"}`, newValue: "Delete undone", userId }, tx);
  }, { timeout: 20_000 }));
  if (!result.error) {
    revalidateViews(projectId);
    publishChange(projectId, "nodes", userId);
  }
  return { ...result, restored };
}
