"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ensureProjectNotArchived } from "./helpers";
import { AllowedRelation } from "@/lib/types";

export async function createRelation(projectId: string, parentNodeTypeId: string, childNodeTypeId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await ensureProjectNotArchived(projectId);
  await prisma.allowedRelation.create({ data: { parentNodeTypeId, childNodeTypeId } });
  revalidatePath(`/project/${projectId}/settings/relations`);
}

export async function deleteRelation(projectId: string, id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await ensureProjectNotArchived(projectId);
  try {
    await prisma.allowedRelation.delete({ where: { id } });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'P2025') throw error;
  }
  revalidatePath(`/project/${projectId}/settings/relations`);
}

export async function getRelations(projectId: string): Promise<AllowedRelation[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const relations = await prisma.allowedRelation.findMany({
    where: { parentNodeType: { projectId } },
    include: { parentNodeType: true, childNodeTypeType: true },
  });
  return relations as AllowedRelation[];
}

export async function addDependency(projectId: string, blockedNodeId: string, blockingNodeId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await ensureProjectNotArchived(projectId);
  if (blockedNodeId === blockingNodeId) throw new Error("A node cannot depend on itself");
  await prisma.nodeDependency.create({ data: { blockedNodeId, blockingNodeId }, });
  revalidatePath(`/project/${projectId}/backlog`);
  revalidatePath(`/project/${projectId}/board`);
}

export async function removeDependency(projectId: string, id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await ensureProjectNotArchived(projectId);
  try {
    await prisma.nodeDependency.delete({ where: { id }, });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'P2025') throw error;
  }
  revalidatePath(`/project/${projectId}/backlog`);
  revalidatePath(`/project/${projectId}/board`);
}
