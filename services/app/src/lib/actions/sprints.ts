"use server";

import prisma from "@/lib/db";
import { publishChange } from "@/lib/realtime/hub";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/lib/utils";
import {
  requireProjectAccess,
  getProjectViewerId,
  logHistoryEvent,
  collectDescendantIds,
  cleanName,
  parseDate,
  toResult,
  UserError,
  type ActionResult,
} from "./helpers";
import { SPRINT_STATUSES } from "@/lib/constants";
import { Sprint } from "@/lib/types";

function assertDateOrder(start: Date | null | undefined, end: Date | null | undefined) {
  if (start && end && end.getTime() < start.getTime()) throw new UserError("The end date can't be before the start date");
}

export async function createSprint(projectId: string, name: string, startDate?: string, endDate?: string) {
  const userId = await requireProjectAccess(projectId);
  const cleanedName = cleanName(name, "Sprint name");
  const start = parseDate(startDate, "start date") ?? null;
  const end = parseDate(endDate, "end date") ?? null;
  assertDateOrder(start, end);

  const sprint = await prisma.$transaction(async (tx) => {
    const created = await tx.sprint.create({
      data: { name: cleanedName, startDate: start, endDate: end, userId, projectId },
    });
    await logHistoryEvent({ projectId, action: 'CREATE', entityType: 'SPRINT', entityName: cleanedName, userId }, tx);
    return created;
  });
  revalidatePath(`/project/${projectId}/sprints`);
  publishChange(projectId, "sprints", userId);
  return serializeData(sprint);
}

export async function getSprints(projectId: string) {
  const userId = await getProjectViewerId(projectId);
  if (!userId) return [];
  const [sprints, counts] = await Promise.all([
    prisma.sprint.findMany({
      where: { projectId },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
    }),
    // One grouped query for real progress numbers (active items only).
    prisma.node.groupBy({
      by: ['sprintId', 'status'],
      where: { projectId, sprintId: { not: null }, isArchived: false },
      _count: { _all: true },
    }),
  ]);

  const totals = new Map<string, { total: number; done: number }>();
  for (const row of counts) {
    if (!row.sprintId) continue;
    const entry = totals.get(row.sprintId) ?? { total: 0, done: 0 };
    entry.total += row._count._all;
    if (row.status === 'DONE') entry.done += row._count._all;
    totals.set(row.sprintId, entry);
  }

  const withCounts = sprints.map((sprint) => {
    const t = totals.get(sprint.id) ?? { total: 0, done: 0 };
    return { ...sprint, _count: { nodes: t.total }, doneCount: t.done };
  });
  return serializeData(withCounts) as (Sprint & { _count: { nodes: number }; doneCount: number })[];
}

export async function updateSprintStatus(projectId: string, id: string, status: string) {
  const userId = await requireProjectAccess(projectId);
  if (!(SPRINT_STATUSES as readonly string[]).includes(status)) throw new Error(`Invalid sprint status: ${status}`);

  await prisma.$transaction(async (tx) => {
    const oldSprint = await tx.sprint.findFirst({ where: { id, projectId } });
    if (!oldSprint) throw new Error("Sprint not found");

    // Only one sprint can be ACTIVE; the demotion and promotion must succeed together.
    if (status === "ACTIVE") {
      await tx.sprint.updateMany({ where: { projectId, status: "ACTIVE", id: { not: id } }, data: { status: "PLANNED" } });
    }
    await tx.sprint.update({ where: { id }, data: { status } });
    await logHistoryEvent({ projectId, action: 'STATUS_CHANGE', entityType: 'SPRINT', entityName: oldSprint.name, oldValue: oldSprint.status, newValue: status, userId }, tx);
  });

  revalidatePath(`/project/${projectId}/sprints`);
  revalidatePath(`/project/${projectId}/board`);
  publishChange(projectId, "sprints", userId);
}

export async function deleteSprint(projectId: string, id: string) {
  const userId = await requireProjectAccess(projectId);

  await prisma.$transaction(async (tx) => {
    const sprint = await tx.sprint.findFirst({ where: { id, projectId } });
    if (!sprint) return;
    await tx.sprint.delete({ where: { id } });
    await logHistoryEvent({ projectId, action: 'DELETE', entityType: 'SPRINT', entityName: sprint.name, userId }, tx);
  });

  revalidatePath(`/project/${projectId}/sprints`);
  revalidatePath(`/project/${projectId}/board`);
  publishChange(projectId, "sprints", userId);
}

export async function assignNodeToSprint(projectId: string, nodeId: string, sprintId: string | null) {
  const userId = await requireProjectAccess(projectId);

  await prisma.$transaction(async (tx) => {
    const node = await tx.node.findFirst({ where: { id: nodeId, projectId }, select: { title: true } });
    if (!node) throw new Error("Node not found");

    let sprintName = 'Backlog';
    if (sprintId) {
      const sprint = await tx.sprint.findFirst({ where: { id: sprintId, projectId }, select: { name: true } });
      if (!sprint) throw new Error("Sprint not found");
      sprintName = sprint.name;
    }

    // Open (not done / not archived) descendants follow their parent, in a single UPDATE.
    const descendantIds = await collectDescendantIds(tx, projectId, nodeId, (c) => c.status !== 'DONE' && !c.isArchived);
    await tx.node.updateMany({ where: { id: { in: [nodeId, ...descendantIds] }, projectId }, data: { sprintId } });

    await logHistoryEvent({ projectId, nodeId, action: 'MOVE', entityType: 'NODE', entityName: node.title, newValue: sprintName, userId }, tx);
  });

  revalidatePath(`/project/${projectId}/backlog`);
  revalidatePath(`/project/${projectId}/board`);
  publishChange(projectId, "nodes", userId, nodeId);
}

export async function updateSprint(projectId: string, id: string, updates: { name?: string; startDate?: string | null; endDate?: string | null; capacity?: number | null }): Promise<ActionResult> {
  const userId = await requireProjectAccess(projectId);
  const result = await toResult(() => prisma.$transaction(async (tx) => {
    const sprint = await tx.sprint.findFirst({ where: { id, projectId } });
    if (!sprint) throw new UserError("This sprint no longer exists");

    const data: { name?: string; startDate?: Date | null; endDate?: Date | null; capacity?: number | null } = {};
    if (updates.name !== undefined && updates.name !== sprint.name) data.name = cleanName(updates.name, "Sprint name");
    const start = parseDate(updates.startDate, "start date");
    const end = parseDate(updates.endDate, "end date");
    if (start !== undefined) data.startDate = start;
    if (end !== undefined) data.endDate = end;
    if (updates.capacity !== undefined) {
      const capacity = updates.capacity;
      if (capacity !== null && (typeof capacity !== "number" || !Number.isFinite(capacity) || capacity < 0 || capacity > 100000)) {
        throw new UserError("Capacity must be a number between 0 and 100000");
      }
      if (capacity !== sprint.capacity) data.capacity = capacity;
    }
    assertDateOrder(start !== undefined ? start : sprint.startDate, end !== undefined ? end : sprint.endDate);

    if (Object.keys(data).length === 0) return;
    await tx.sprint.update({ where: { id }, data });
    await logHistoryEvent({ projectId, action: 'UPDATE', entityType: 'SPRINT', entityName: data.name ?? sprint.name, oldValue: data.name ? sprint.name : undefined, newValue: data.name, userId }, tx);
  }));
  if (!result.error) {
    revalidatePath(`/project/${projectId}/sprints`);
    revalidatePath(`/project/${projectId}/board`);
    publishChange(projectId, "sprints", userId);
  }
  return result;
}
