"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { publishChange } from "@/lib/realtime/hub";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/lib/utils";
import { completedAtFor } from "@/lib/status";
import { POSITION_STEP } from "@/lib/order";
import { snapshotNodes } from "./undoStore";
import { emitWebhook } from "@/lib/webhooks/deliver";
import { addWatchers, createNotifications, displayName, pushNotifications, watcherIds } from "./notify";
import { statusMeta } from "@/lib/statusMeta";
import {
  requireProjectAccess,
  logHistoryEvent,
  propagateStatusUpwards,
  reconcileParentStatuses,
  propagateTimelineShift,
  collectDescendantIds,
  wouldCreateParentCycle,
  validateNodeContent,
  cleanTitle,
  assertNodeStatus,
  parseDate,
  toResult,
  UserError,
  type ActionResult,
  type Db,
} from "./helpers";

function revalidateNodeViews(projectId: string) {
  revalidatePath(`/project/${projectId}/backlog`);
  revalidatePath(`/project/${projectId}/board`);
}

/** The owner or a member of the project (used to validate assignees). */
async function isProjectParticipant(db: Db, projectId: string, userId: string): Promise<boolean> {
  const project = await db.project.findFirst({
    where: { id: projectId, OR: [{ userId }, { members: { some: { userId } } }] },
    select: { id: true },
  });
  return !!project;
}

export async function createNode(projectId: string, parentNodeId: string | null, nodeTypeId: string, title: string, content: Record<string, unknown> = {}, sprintId?: string | null, initialStatus?: string) {
  const userId = await requireProjectAccess(projectId);
  const cleanedTitle = cleanTitle(title);
  if (initialStatus !== undefined) assertNodeStatus(initialStatus);

  const newNode = await prisma.$transaction(async (tx) => {
    const nodeType = await tx.nodeType.findFirst({ where: { id: nodeTypeId, projectId }, select: { id: true } });
    if (!nodeType) throw new Error("Node type not found");

    if (sprintId) {
      const sprint = await tx.sprint.findFirst({ where: { id: sprintId, projectId }, select: { id: true } });
      if (!sprint) throw new Error("Sprint not found");
    }

    if (parentNodeId) {
      const parentNode = await tx.node.findFirst({ where: { id: parentNodeId, projectId }, include: { type: true } });
      if (!parentNode) throw new Error("Parent node not found");
      const isAllowed = await tx.allowedRelation.findFirst({
        where: { parentNodeTypeId: parentNode.nodeTypeId, childNodeTypeId: nodeTypeId }
      });
      if (!isAllowed) throw new Error(`Cannot add this type of node under a ${parentNode.type.name}`);
    }

    const cleanContent = await validateNodeContent(tx, nodeTypeId, content);
    // New items go to the end of any manually ordered list.
    const last = await tx.node.aggregate({ where: { projectId }, _max: { position: true } });
    const node = await tx.node.create({
      data: {
        userId, projectId, nodeTypeId, title: cleanedTitle, content: cleanContent as Prisma.JsonObject, sprintId: sprintId ?? null,
        position: (last._max.position ?? 0) + POSITION_STEP,
        ...(initialStatus ? { status: initialStatus, completedAt: initialStatus === "DONE" ? new Date() : null } : {}),
      },
      include: { type: true }
    });

    if (parentNodeId) {
      await tx.nodeLink.create({ data: { parentNodeId, childNodeId: node.id } });
      // A new unfinished child reopens a DONE parent.
      await propagateStatusUpwards(projectId, node.id, userId, tx);
    }

    await addWatchers(tx, node.id, [userId]);
    await logHistoryEvent({ projectId, nodeId: node.id, action: 'CREATE', entityType: 'NODE', entityName: cleanedTitle, newValue: node.type.name, userId }, tx);
    return node;
  });

  revalidateNodeViews(projectId);
  publishChange(projectId, "nodes", userId, newNode.id);
  emitWebhook(projectId, "item.created", { actorId: userId, item: { id: newNode.id, title: newNode.title, status: newNode.status, type: newNode.type.name, parentId: parentNodeId } });
  return serializeData(newNode);
}

type NodeUpdates = {
  title?: string;
  description?: string;
  content?: Record<string, unknown>;
  status?: string;
  isArchived?: boolean;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  assigneeId?: string | null;
};

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Only values that actually changed are validated. Editing the title must never be blocked by some other field
 * that went stale (an option that was later removed, an old date range, ...), and the editor re-sends everything.
 */
export async function updateNode(projectId: string, id: string, updates: NodeUpdates): Promise<ActionResult> {
  const userId = await requireProjectAccess(projectId);
  const pushIds: string[] = [];
  let changed: { title: string; status: string; fields: string[]; from?: string } | null = null;

  const result = await toResult(() => prisma.$transaction(async (tx) => {
    const oldNode = await tx.node.findFirst({ where: { id, projectId }, include: { assignee: { select: { name: true, email: true } } } });
    if (!oldNode) throw new UserError("This item no longer exists");

    // Whitelist the fields a client may change; never spread untrusted input into the query.
    const data: Prisma.NodeUncheckedUpdateInput = {};
    if (updates.title !== undefined && updates.title !== oldNode.title) data.title = cleanTitle(updates.title);
    if (updates.description !== undefined && (updates.description || null) !== (oldNode.description || null)) data.description = updates.description;
    if (updates.isArchived !== undefined) data.isArchived = Boolean(updates.isArchived);
    if (updates.status !== undefined && updates.status !== oldNode.status) {
      assertNodeStatus(updates.status);
      data.status = updates.status;
      const completedAt = completedAtFor(oldNode.status, updates.status);
      if (completedAt !== undefined) data.completedAt = completedAt;
    }

    const startDate = parseDate(updates.startDate, "start date");
    const endDate = parseDate(updates.endDate, "end date");
    const startChanged = startDate !== undefined && startDate?.getTime() !== oldNode.startDate?.getTime();
    const endChanged = endDate !== undefined && endDate?.getTime() !== oldNode.endDate?.getTime();
    if (startChanged) data.startDate = startDate;
    if (endChanged) data.endDate = endDate;
    if (startChanged || endChanged) {
      const effectiveStart = startChanged ? startDate : oldNode.startDate;
      const effectiveEnd = endChanged ? endDate : oldNode.endDate;
      if (effectiveStart && effectiveEnd && effectiveEnd.getTime() < effectiveStart.getTime()) {
        throw new UserError("The end date can't be before the start date");
      }
    }

    let newAssigneeName: string | null | undefined;
    if (updates.assigneeId !== undefined && (updates.assigneeId || null) !== oldNode.assigneeId) {
      if (updates.assigneeId) {
        if (!(await isProjectParticipant(tx, projectId, updates.assigneeId))) throw new UserError("That person isn't a member of this project");
        const person = await tx.user.findUnique({ where: { id: updates.assigneeId }, select: { name: true, email: true } });
        newAssigneeName = person?.name || person?.email || "Someone";
      } else {
        newAssigneeName = null;
      }
      data.assigneeId = updates.assigneeId || null;
    }

    if (updates.content) {
      const existing = (oldNode.content as Record<string, unknown> | null) ?? {};
      const changed = Object.fromEntries(Object.entries(updates.content).filter(([key, value]) => !sameJson(value, existing[key])));
      if (Object.keys(changed).length > 0) {
        const incoming = await validateNodeContent(tx, oldNode.nodeTypeId, changed, { partial: true });
        data.content = { ...existing, ...incoming } as Prisma.JsonObject;
      }
    }

    if (Object.keys(data).length === 0) return;
    const node = await tx.node.update({ where: { id }, data });
    changed = { title: node.title, status: node.status, fields: Object.keys(data).map((k) => (k === "assigneeId" ? "assignee" : k === "content" ? "fields" : k === "isArchived" ? "archived" : k)), ...(data.status && data.status !== oldNode.status ? { from: oldNode.status } : {}) };

    if (data.status && data.status !== oldNode.status) {
      await propagateStatusUpwards(projectId, id, userId, tx);
      await logHistoryEvent({ projectId, nodeId: id, action: 'STATUS_CHANGE', entityType: 'NODE', entityName: node.title, oldValue: oldNode.status, newValue: data.status as string, userId }, tx);
      const watchers = await watcherIds(tx, id);
      if (watchers.some((w) => w !== userId)) {
        pushIds.push(...await createNotifications(tx, { projectId, nodeId: id, actorId: userId, type: "STATUS", recipients: watchers, title: `${await displayName(tx, userId)} moved “${node.title}” to ${statusMeta(data.status as string).label}` }));
      }
    }
    if (endChanged && endDate) {
      await propagateTimelineShift(projectId, id, userId, tx);
    }
    if (data.title) {
      await logHistoryEvent({ projectId, nodeId: id, action: 'UPDATE', entityType: 'NODE', entityName: node.title, oldValue: oldNode.title, newValue: data.title as string, userId }, tx);
    }
    if (newAssigneeName !== undefined) {
      await logHistoryEvent({
        projectId, nodeId: id, action: 'ASSIGN', entityType: 'NODE', entityName: node.title,
        oldValue: oldNode.assignee ? (oldNode.assignee.name || oldNode.assignee.email || "Someone") : "Unassigned",
        newValue: newAssigneeName ?? "Unassigned", userId,
      }, tx);
      if (data.assigneeId) {
        await addWatchers(tx, id, [data.assigneeId as string]);
        pushIds.push(...await createNotifications(tx, { projectId, nodeId: id, actorId: userId, type: "ASSIGNED", recipients: [data.assigneeId as string], title: `${await displayName(tx, userId)} assigned you to “${node.title}”` }));
      }
    }
  }));

  if (!result.error) {
    revalidateNodeViews(projectId);
    publishChange(projectId, "nodes", userId, id);
    pushNotifications(pushIds);
    if (changed) {
      const c = changed as { title: string; status: string; fields: string[]; from?: string };
      emitWebhook(projectId, "item.updated", { actorId: userId, item: { id, title: c.title, status: c.status }, changed: c.fields });
      if (c.from) emitWebhook(projectId, "item.status_changed", { actorId: userId, item: { id, title: c.title, status: c.status }, from: c.from, to: c.status });
    }
  }
  return result;
}

export async function deleteNode(projectId: string, id: string): Promise<{ undoId?: string }> {
  const userId = await requireProjectAccess(projectId);
  let undoId: string | undefined;
  let deletedTitle: string | null = null;

  await prisma.$transaction(async (tx) => {
    const node = await tx.node.findFirst({ where: { id, projectId }, select: { title: true } });
    if (!node) return; // already gone: deleting is idempotent
    deletedTitle = node.title;

    const snapshots = await snapshotNodes(tx, projectId, [id]);
    const entry = await tx.undoEntry.create({ data: { projectId, userId, kind: "DELETE_NODE", payload: snapshots as unknown as object } });
    undoId = entry.id;

    const parentLinks = await tx.nodeLink.findMany({ where: { childNodeId: id }, select: { parentNodeId: true } });
    await tx.node.delete({ where: { id } });
    await logHistoryEvent({ projectId, action: 'DELETE', entityType: 'NODE', entityName: node.title, userId }, tx);
    // Removing the last unfinished child can complete the parent.
    await reconcileParentStatuses(projectId, parentLinks.map(l => l.parentNodeId), userId, tx);
  });

  revalidateNodeViews(projectId);
  publishChange(projectId, "nodes", userId, id);
  if (deletedTitle !== null) emitWebhook(projectId, "item.deleted", { actorId: userId, item: { id, title: deletedTitle } });
  return { undoId };
}

export async function archiveNode(projectId: string, id: string, isArchived: boolean, archiveChildren: boolean = false) {
  const userId = await requireProjectAccess(projectId);

  await prisma.$transaction(async (tx) => {
    const root = await tx.node.findFirst({ where: { id, projectId }, select: { id: true, title: true } });
    if (!root) throw new Error("Node not found");

    let ids = [id];
    if (isArchived && archiveChildren) {
      const descendantIds = await collectDescendantIds(tx, projectId, id, (child) => !child.isArchived);
      ids = [id, ...descendantIds];
    }

    const targets = await tx.node.findMany({ where: { id: { in: ids }, projectId }, select: { id: true, title: true } });
    await tx.node.updateMany({ where: { id: { in: ids }, projectId }, data: { isArchived } });

    for (const n of targets) {
      await logHistoryEvent({ projectId, nodeId: n.id, action: isArchived ? 'ARCHIVE' : 'RESTORE', entityType: 'NODE', entityName: n.title, userId }, tx);
    }

    // Archived children no longer hold their parent back (and restored ones do again).
    await propagateStatusUpwards(projectId, id, userId, tx);
  });

  revalidateNodeViews(projectId);
  publishChange(projectId, "nodes", userId, id);
}

export async function updateNodeParent(projectId: string, nodeId: string, newParentNodeId: string | null): Promise<ActionResult> {
  const userId = await requireProjectAccess(projectId);

  const result = await toResult(() => prisma.$transaction(async (tx) => {
    const childNode = await tx.node.findFirst({ where: { id: nodeId, projectId }, select: { title: true, nodeTypeId: true } });
    if (!childNode) throw new Error("Node not found");

    // Validate everything about the target BEFORE touching existing links.
    let newParent: { title: string } | null = null;
    if (newParentNodeId) {
      const parentNode = await tx.node.findFirst({ where: { id: newParentNodeId, projectId }, select: { title: true, nodeTypeId: true, type: { select: { name: true } } } });
      if (!parentNode) throw new Error("Parent node not found");
      if (await wouldCreateParentCycle(tx, nodeId, newParentNodeId)) {
        throw new UserError("A node cannot be moved under itself or one of its descendants");
      }
      const isAllowed = await tx.allowedRelation.findFirst({
        where: { parentNodeTypeId: parentNode.nodeTypeId, childNodeTypeId: childNode.nodeTypeId }
      });
      if (!isAllowed) throw new UserError(`This type of node cannot be placed under a ${parentNode.type.name}`);
      newParent = parentNode;
    }

    const oldLinks = await tx.nodeLink.findMany({
      where: { childNodeId: nodeId, parentNode: { projectId } },
      include: { parentNode: { select: { title: true } } }
    });
    const oldParentIds = oldLinks.map(l => l.parentNodeId);

    if (newParentNodeId && oldParentIds.length === 1 && oldParentIds[0] === newParentNodeId) return; // no-op

    await tx.nodeLink.deleteMany({ where: { childNodeId: nodeId, parentNode: { projectId } } });
    if (newParentNodeId) {
      await tx.nodeLink.create({ data: { parentNodeId: newParentNodeId, childNodeId: nodeId } });
    }

    await logHistoryEvent({
      projectId,
      nodeId,
      action: 'UPDATE',
      entityType: 'NODE',
      entityName: childNode.title,
      oldValue: oldLinks[0]?.parentNode.title || "None",
      newValue: newParent?.title ?? "None (Unparented)",
      userId
    }, tx);

    // Both the old and the new parents may need a new derived status.
    await reconcileParentStatuses(projectId, oldParentIds, userId, tx);
    await propagateStatusUpwards(projectId, nodeId, userId, tx);
  }));

  if (!result.error) {
    revalidateNodeViews(projectId);
    publishChange(projectId, "nodes", userId, nodeId);
  }
  return result;
}
