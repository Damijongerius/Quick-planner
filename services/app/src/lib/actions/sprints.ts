"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/lib/utils";
import { logHistoryEvent, ensureProjectNotArchived } from "./helpers";
import { Sprint } from "@/lib/types";

export async function createSprint(projectId: string, name: string, startDate?: string, endDate?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await ensureProjectNotArchived(projectId);
  const sprint = await prisma.sprint.create({
    data: { name, startDate: startDate ? new Date(startDate) : null, endDate: endDate ? new Date(endDate) : null, userId: session.user.id, projectId },
  });
  await logHistoryEvent({ projectId, action: 'CREATE', entityType: 'SPRINT', entityName: name });
  revalidatePath(`/project/${projectId}/sprints`);
  return serializeData(sprint);
}

export async function getSprints(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const sprints = await prisma.sprint.findMany({
    where: { userId: session.user.id, projectId },
    include: { _count: { select: { nodes: true } } },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
  });
  return serializeData(sprints) as (Sprint & { _count: { nodes: number } })[];
}

export async function updateSprintStatus(projectId: string, id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await ensureProjectNotArchived(projectId);
  const oldSprint = await prisma.sprint.findUnique({ where: { id } });
  if (status === "ACTIVE") {
    await prisma.sprint.updateMany({ where: { userId: session.user.id, projectId, status: "ACTIVE" }, data: { status: "PLANNED" } });
  }
  await prisma.sprint.update({ where: { id, userId: session.user.id, projectId }, data: { status }, });
  await logHistoryEvent({ projectId, action: 'STATUS_CHANGE', entityType: 'SPRINT', entityName: oldSprint?.name, oldValue: oldSprint?.status, newValue: status });
  revalidatePath(`/project/${projectId}/sprints`);
  revalidatePath(`/project/${projectId}/board`);
}

export async function deleteSprint(projectId: string, id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await ensureProjectNotArchived(projectId);
  
  const sprint = await prisma.sprint.findUnique({ where: { id } });
  
  await prisma.sprint.delete({
    where: { id, userId: session.user.id, projectId },
  });

  await logHistoryEvent({ 
    projectId, 
    action: 'DELETE', 
    entityType: 'SPRINT', 
    entityName: sprint?.name 
  });

  revalidatePath(`/project/${projectId}/sprints`);
  revalidatePath(`/project/${projectId}/board`);
}

export async function assignNodeToSprint(projectId: string, nodeId: string, sprintId: string | null) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await ensureProjectNotArchived(projectId);
  const node = await prisma.node.findUnique({ where: { id: nodeId } });
  const sprint = sprintId ? await prisma.sprint.findUnique({ where: { id: sprintId } }) : null;
  await prisma.node.update({ where: { id: nodeId, userId: session.user.id, projectId }, data: { sprintId }, });
  
  await cascadeSprintToChildren(projectId, session.user.id, nodeId, sprintId);

  await logHistoryEvent({ projectId, nodeId, action: 'MOVE', entityType: 'NODE', entityName: node?.title, newValue: sprint?.name || 'Backlog' });
  revalidatePath(`/project/${projectId}/backlog`);
  revalidatePath(`/project/${projectId}/board`);
}

async function cascadeSprintToChildren(projectId: string, userId: string, parentId: string, sprintId: string | null) {
  const links = await prisma.nodeLink.findMany({
    where: { parentNodeId: parentId },
    include: { childNode: true }
  });

  for (const link of links) {
    const child = link.childNode;
    if (child.status === 'DONE' || child.isArchived) {
      continue;
    }
    await prisma.node.update({
      where: { id: child.id, userId, projectId },
      data: { sprintId }
    });
    await cascadeSprintToChildren(projectId, userId, child.id, sprintId);
  }
}
