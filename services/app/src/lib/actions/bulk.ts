"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { publishChange } from "@/lib/realtime/hub";
import { assignPositions } from "@/lib/order";
import { completedAtFor } from "@/lib/status";
import { isNodeStatus } from "@/lib/constants";
import { statusMeta } from "@/lib/statusMeta";
import { emitWebhook } from "@/lib/webhooks/deliver";
import { addWatchers, createNotifications, displayName, pushNotifications, watcherIds } from "./notify";
import {
  UserError,
  collectDescendantIds,
  logHistoryEvent,
  propagateStatusUpwards,
  requireProjectAccess,
  toResult,
  type ActionResult,
} from "./helpers";

const MAX_BULK = 200;
const MAX_REORDER = 500;

function revalidateViews(projectId: string) {
  for (const page of ["backlog", "board", "timeline", "planning"]) revalidatePath(`/project/${projectId}/${page}`);
}

/**
 * Persist a manual order. `orderedIds` is the list exactly as the user now sees it; the items keep sharing
 * the slots they already occupied overall, so unrelated items elsewhere don't move.
 */
export async function reorderNodes(projectId: string, orderedIds: string[]): Promise<ActionResult> {
  const userId = await requireProjectAccess(projectId);
  const result = await toResult(async () => {
    const ids = [...new Set(orderedIds)];
    if (ids.length === 0 || ids.length > MAX_REORDER) throw new UserError("Nothing to reorder");
    await prisma.$transaction(async (tx) => {
      const nodes = await tx.node.findMany({ where: { id: { in: ids }, projectId }, select: { id: true, position: true } });
      if (nodes.length !== ids.length) throw new UserError("Some of these items no longer exist");
      const base = Math.min(...nodes.map((n) => n.position));
      for (const [id, position] of assignPositions(ids, base)) {
        await tx.node.update({ where: { id }, data: { position } });
      }
    });
  });
  if (!result.error) {
    revalidateViews(projectId);
    publishChange(projectId, "nodes", userId);
  }
  return result;
}

export type BulkPatch = { status?: string; assigneeId?: string | null; sprintId?: string | null; isArchived?: boolean };
export type BulkPrevious = { id: string; status: string; assigneeId: string | null; sprintId: string | null; isArchived: boolean };
export type BulkResult = ActionResult & { count?: number; previous?: BulkPrevious[] };

/** Change several items at once. Returns what they were before, so the caller can offer "Undo". */
export async function bulkUpdateNodes(projectId: string, ids: string[], patch: BulkPatch): Promise<BulkResult> {
  const userId = await requireProjectAccess(projectId);
  let previous: BulkPrevious[] = [];
  const pushIds: string[] = [];
  const touched: { id: string; title: string; status: string; fields: string[]; from?: string }[] = [];

  const result = await toResult(() => prisma.$transaction(async (tx) => {
    const unique = [...new Set(ids)];
    if (unique.length === 0) throw new UserError("Select at least one item");
    if (unique.length > MAX_BULK) throw new UserError(`You can change up to ${MAX_BULK} items at once`);
    if (patch.status !== undefined && !isNodeStatus(patch.status)) throw new UserError(`Invalid status: ${patch.status}`);

    if (patch.assigneeId) {
      const ok = await tx.project.findFirst({ where: { id: projectId, OR: [{ userId: patch.assigneeId }, { members: { some: { userId: patch.assigneeId } } }] }, select: { id: true } });
      if (!ok) throw new UserError("That person isn't a member of this project");
    }
    let sprintName = "Backlog";
    if (patch.sprintId) {
      const sprint = await tx.sprint.findFirst({ where: { id: patch.sprintId, projectId }, select: { name: true } });
      if (!sprint) throw new UserError("Sprint not found");
      sprintName = sprint.name;
    }

    const nodes = await tx.node.findMany({ where: { id: { in: unique }, projectId }, include: { assignee: { select: { name: true, email: true } } } });
    if (nodes.length !== unique.length) throw new UserError("Some of these items no longer exist");
    previous = nodes.map((n) => ({ id: n.id, status: n.status, assigneeId: n.assigneeId, sprintId: n.sprintId, isArchived: n.isArchived }));

    let assigneeName: string | null = null;
    if (patch.assigneeId) {
      const person = await tx.user.findUnique({ where: { id: patch.assigneeId }, select: { name: true, email: true } });
      assigneeName = person?.name || person?.email || "Someone";
    }

    for (const node of nodes) {
      const fields: string[] = [];
      if (patch.status !== undefined && patch.status !== node.status) fields.push("status");
      if (patch.assigneeId !== undefined && (patch.assigneeId || null) !== node.assigneeId) fields.push("assignee");
      if (patch.sprintId !== undefined && (patch.sprintId || null) !== node.sprintId) fields.push("sprint");
      if (patch.isArchived !== undefined && patch.isArchived !== node.isArchived) fields.push("archived");
      if (fields.length > 0) touched.push({ id: node.id, title: node.title, status: fields.includes("status") ? (patch.status as string) : node.status, fields, ...(fields.includes("status") ? { from: node.status } : {}) });
      if (patch.status !== undefined && patch.status !== node.status) {
        await tx.node.update({ where: { id: node.id }, data: { status: patch.status, completedAt: completedAtFor(node.status, patch.status) } });
        await propagateStatusUpwards(projectId, node.id, userId, tx);
        await logHistoryEvent({ projectId, nodeId: node.id, action: "STATUS_CHANGE", entityType: "NODE", entityName: node.title, oldValue: node.status, newValue: patch.status, userId }, tx);
        const watchers = await watcherIds(tx, node.id);
        if (watchers.some((w) => w !== userId)) {
          pushIds.push(...await createNotifications(tx, { projectId, nodeId: node.id, actorId: userId, type: "STATUS", recipients: watchers, title: `${await displayName(tx, userId)} moved “${node.title}” to ${statusMeta(patch.status).label}` }));
        }
      }
      if (patch.assigneeId !== undefined && (patch.assigneeId || null) !== node.assigneeId) {
        await tx.node.update({ where: { id: node.id }, data: { assigneeId: patch.assigneeId || null } });
        await logHistoryEvent({
          projectId, nodeId: node.id, action: "ASSIGN", entityType: "NODE", entityName: node.title,
          oldValue: node.assignee ? (node.assignee.name || node.assignee.email || "Someone") : "Unassigned",
          newValue: assigneeName ?? "Unassigned", userId,
        }, tx);
        if (patch.assigneeId) {
          await addWatchers(tx, node.id, [patch.assigneeId]);
          pushIds.push(...await createNotifications(tx, { projectId, nodeId: node.id, actorId: userId, type: "ASSIGNED", recipients: [patch.assigneeId], title: `${await displayName(tx, userId)} assigned you to “${node.title}”` }));
        }
      }
      if (patch.sprintId !== undefined && (patch.sprintId || null) !== node.sprintId) {
        // Open children follow their parent, like moving a single item does.
        const descendants = await collectDescendantIds(tx, projectId, node.id, (c) => c.status !== "DONE" && !c.isArchived);
        await tx.node.updateMany({ where: { id: { in: [node.id, ...descendants] }, projectId }, data: { sprintId: patch.sprintId || null } });
        await logHistoryEvent({ projectId, nodeId: node.id, action: "MOVE", entityType: "NODE", entityName: node.title, newValue: sprintName, userId }, tx);
      }
      if (patch.isArchived !== undefined && patch.isArchived !== node.isArchived) {
        await tx.node.update({ where: { id: node.id }, data: { isArchived: patch.isArchived } });
        await logHistoryEvent({ projectId, nodeId: node.id, action: patch.isArchived ? "ARCHIVE" : "RESTORE", entityType: "NODE", entityName: node.title, userId }, tx);
        await propagateStatusUpwards(projectId, node.id, userId, tx);
      }
    }
  }, { timeout: 20_000 }));

  if (!result.error) {
    revalidateViews(projectId);
    publishChange(projectId, "nodes", userId);
    pushNotifications(pushIds);
    for (const t of touched.slice(0, 100)) {
      emitWebhook(projectId, "item.updated", { actorId: userId, item: { id: t.id, title: t.title, status: t.status }, changed: t.fields });
      if (t.from) emitWebhook(projectId, "item.status_changed", { actorId: userId, item: { id: t.id, title: t.title, status: t.status }, from: t.from, to: t.status });
    }
  }
  return { ...result, count: ids.length, previous };
}

/** Put items back exactly as `bulkUpdateNodes` reported them (the "Undo" of a bulk edit). */
export async function restoreNodes(projectId: string, previous: BulkPrevious[]): Promise<ActionResult> {
  const userId = await requireProjectAccess(projectId);
  const result = await toResult(() => prisma.$transaction(async (tx) => {
    if (previous.length > MAX_BULK) throw new UserError("Too many items");
    for (const p of previous) {
      const node = await tx.node.findFirst({ where: { id: p.id, projectId }, select: { status: true, title: true } });
      if (!node) continue; // deleted in the meantime
      if (!isNodeStatus(p.status)) continue;
      await tx.node.update({
        where: { id: p.id },
        data: { status: p.status, assigneeId: p.assigneeId, sprintId: p.sprintId, isArchived: p.isArchived, completedAt: completedAtFor(node.status, p.status) },
      });
      await propagateStatusUpwards(projectId, p.id, userId, tx);
    }
  }, { timeout: 20_000 }));
  if (!result.error) {
    revalidateViews(projectId);
    publishChange(projectId, "nodes", userId);
  }
  return result;
}
