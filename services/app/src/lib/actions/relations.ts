"use server";

import prisma from "@/lib/db";
import { publishChange } from "@/lib/realtime/hub";
import { revalidatePath } from "next/cache";
import { requireProjectAccess, getProjectViewerId, wouldCreateDependencyCycle, toResult, UserError, type ActionResult } from "./helpers";
import { AllowedRelation } from "@/lib/types";

export async function createRelation(projectId: string, parentNodeTypeId: string, childNodeTypeId: string) {
  const userId = await requireProjectAccess(projectId);

  const types = await prisma.nodeType.count({
    where: { id: { in: [parentNodeTypeId, childNodeTypeId] }, projectId }
  });
  const expected = parentNodeTypeId === childNodeTypeId ? 1 : 2;
  if (types !== expected) throw new Error("Node type not found");

  const existing = await prisma.allowedRelation.findFirst({ where: { parentNodeTypeId, childNodeTypeId }, select: { id: true } });
  if (!existing) {
    await prisma.allowedRelation.create({ data: { parentNodeTypeId, childNodeTypeId } });
  }
  revalidatePath(`/project/${projectId}/settings/relations`);
  publishChange(projectId, "types", userId);
}

export async function deleteRelation(projectId: string, id: string) {
  const userId = await requireProjectAccess(projectId);
  await prisma.allowedRelation.deleteMany({
    where: { id, parentNodeType: { projectId } }
  });
  revalidatePath(`/project/${projectId}/settings/relations`);
  publishChange(projectId, "types", userId);
}

export async function getRelations(projectId: string): Promise<AllowedRelation[]> {
  if (!(await getProjectViewerId(projectId))) return [];
  const relations = await prisma.allowedRelation.findMany({
    where: { parentNodeType: { projectId } },
    include: { parentNodeType: true, childNodeTypeType: true },
  });
  return relations as AllowedRelation[];
}

export async function addDependency(projectId: string, blockedNodeId: string, blockingNodeId: string): Promise<ActionResult> {
  const userId = await requireProjectAccess(projectId);
  if (blockedNodeId === blockingNodeId) return { error: "A node cannot depend on itself" };

  const result = await toResult(() => prisma.$transaction(async (tx) => {
    const nodes = await tx.node.count({ where: { id: { in: [blockedNodeId, blockingNodeId] }, projectId } });
    if (nodes !== 2) throw new Error("Node not found");

    const existing = await tx.nodeDependency.findFirst({ where: { blockedNodeId, blockingNodeId }, select: { id: true } });
    if (existing) return;

    if (await wouldCreateDependencyCycle(tx, blockedNodeId, blockingNodeId)) {
      throw new UserError("This dependency would create a circular chain");
    }
    await tx.nodeDependency.create({ data: { blockedNodeId, blockingNodeId } });
  }));

  if (!result.error) {
    revalidatePath(`/project/${projectId}/backlog`);
    revalidatePath(`/project/${projectId}/board`);
    publishChange(projectId, "nodes", userId, blockedNodeId);
  }
  return result;
}

export async function removeDependency(projectId: string, id: string) {
  const userId = await requireProjectAccess(projectId);
  await prisma.nodeDependency.deleteMany({
    where: { id, blockedNode: { projectId } }
  });
  revalidatePath(`/project/${projectId}/backlog`);
  revalidatePath(`/project/${projectId}/board`);
  publishChange(projectId, "nodes", userId);
}
