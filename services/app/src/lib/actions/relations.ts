"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createRelation(projectId: string, parentNodeTypeId: string, childNodeTypeId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.allowedRelation.create({ data: { parentNodeTypeId, childNodeTypeId } });
  revalidatePath(`/project/${projectId}/settings/relations`);
}

export async function deleteRelation(projectId: string, id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  try {
    await prisma.allowedRelation.delete({ where: { id } });
  } catch (error: any) {
    if (error.code !== 'P2025') throw error;
  }
  revalidatePath(`/project/${projectId}/settings/relations`);
}

export async function getRelations(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  return await prisma.allowedRelation.findMany({
    where: { parentNodeType: { projectId } },
    include: { parentNodeType: true, childNodeTypeType: true },
  });
}

export async function addDependency(projectId: string, blockedNodeId: string, blockingNodeId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (blockedNodeId === blockingNodeId) throw new Error("A node cannot depend on itself");
  await prisma.nodeDependency.create({ data: { blockedNodeId, blockingNodeId }, });
  revalidatePath(`/project/${projectId}/backlog`);
  revalidatePath(`/project/${projectId}/board`);
}

export async function removeDependency(projectId: string, id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  try {
    await prisma.nodeDependency.delete({ where: { id }, });
  } catch (error: any) {
    if (error.code !== 'P2025') throw error;
  }
  revalidatePath(`/project/${projectId}/backlog`);
  revalidatePath(`/project/${projectId}/board`);
}
