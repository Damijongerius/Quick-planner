"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/lib/utils";
import { logHistoryEvent, propagateStatusUpwards, propagateTimelineShift } from "./helpers";

export async function createNode(projectId: string, parentNodeId: string | null, nodeTypeId: string, title: string, content: any = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const newNode = await prisma.node.create({
    data: { userId: session.user.id, projectId, nodeTypeId, title, content },
    include: { type: true }
  });
  if (parentNodeId) {
    const parentNode = await prisma.node.findUnique({ where: { id: parentNodeId, projectId }, include: { type: true } });
    if (!parentNode) throw new Error("Parent node not found");
    const isAllowed = await prisma.allowedRelation.findFirst({
      where: { parentNodeTypeId: parentNode.nodeTypeId, childNodeTypeId: nodeTypeId }
    });
    if (!isAllowed) throw new Error(`Cannot add this type of node under a ${parentNode.type.name}`);
    await prisma.nodeLink.create({ data: { parentNodeId, childNodeId: newNode.id } });
  }
  await logHistoryEvent({ projectId, nodeId: newNode.id, action: 'CREATE', entityType: 'NODE', entityName: title, newValue: newNode.type.name });
  revalidatePath(`/project/${projectId}/backlog`);
  return serializeData(newNode);
}

export async function updateNode(projectId: string, id: string, updates: { 
    title?: string, description?: string, content?: any, status?: string, 
    isArchived?: boolean, startDate?: string | Date | null, endDate?: string | Date | null
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const oldNode = await prisma.node.findUnique({ where: { id } });
  const data: any = { ...updates };
  if (updates.startDate) data.startDate = new Date(updates.startDate);
  if (updates.endDate) data.endDate = new Date(updates.endDate);

  const node = await prisma.node.update({ where: { id, userId: session.user.id, projectId }, data });
  if (updates.status && updates.status !== oldNode?.status) await propagateStatusUpwards(projectId, id, updates.status);
  if (updates.endDate && (!oldNode?.endDate || new Date(updates.endDate).getTime() !== oldNode.endDate.getTime())) await propagateTimelineShift(projectId, id);
  if (updates.title && updates.title !== oldNode?.title) await logHistoryEvent({ projectId, nodeId: id, action: 'UPDATE', entityType: 'NODE', entityName: node.title, oldValue: oldNode?.title, newValue: updates.title });
  revalidatePath(`/project/${projectId}/backlog`);
  revalidatePath(`/project/${projectId}/board`);
}

export async function deleteNode(projectId: string, id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const node = await prisma.node.findUnique({ where: { id } });
  try {
    await prisma.node.delete({ where: { id, userId: session.user.id, projectId } });
    await logHistoryEvent({ projectId, action: 'DELETE', entityType: 'NODE', entityName: node?.title });
  } catch (error: any) { if (error.code !== 'P2025') throw error; }
  revalidatePath(`/project/${projectId}/backlog`);
}

export async function archiveNode(projectId: string, id: string, isArchived: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const node = await prisma.node.update({ where: { id, userId: session.user.id, projectId }, data: { isArchived }, });
  await logHistoryEvent({ projectId, nodeId: id, action: isArchived ? 'ARCHIVE' : 'RESTORE', entityType: 'NODE', entityName: node.title });
  revalidatePath(`/project/${projectId}/backlog`);
}
