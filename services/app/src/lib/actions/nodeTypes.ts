"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/lib/utils";
import { logHistoryEvent } from "./helpers";

export async function createNodeType(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const icon = formData.get("icon") as string || "Target";
  await prisma.nodeType.create({
    data: { name, color, icon, userId: session.user.id, projectId },
  });
  await logHistoryEvent({ projectId, action: 'CREATE', entityType: 'NODETYPE', entityName: name });
  revalidatePath(`/project/${projectId}/settings/nodes`);
}

export async function updateNodeType(projectId: string, id: string, name: string, color: string, icon: string, isSprintEligible: boolean = true) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.nodeType.update({
    where: { id, userId: session.user.id, projectId },
    data: { name, color, icon, isSprintEligible },
  });
  revalidatePath(`/project/${projectId}/settings/nodes`);
}

export async function deleteNodeType(projectId: string, id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  try {
    await prisma.nodeType.delete({ where: { id, userId: session.user.id, projectId } });
  } catch (error: any) {
    if (error.code !== 'P2025') throw error;
  }
  revalidatePath(`/project/${projectId}/settings/nodes`);
}

export async function addFieldDefinition(projectId: string, nodeTypeId: string, name: string, type: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.fieldDefinition.create({ data: { nodeTypeId, name, type } });
  revalidatePath(`/project/${projectId}/settings/nodes`);
}

export async function removeFieldDefinition(projectId: string, id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  try {
    await prisma.fieldDefinition.delete({ where: { id } });
  } catch (error: any) {
    if (error.code !== 'P2025') throw error;
  }
  revalidatePath(`/project/${projectId}/settings/nodes`);
}

export async function getNodeTypes(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const nodeTypes = await prisma.nodeType.findMany({
    where: { userId: session.user.id, projectId },
    include: { fields: true, allowedChildren: { include: { childNodeTypeType: true } } },
    orderBy: { createdAt: "asc" },
  });
  return serializeData(nodeTypes);
}

export async function updateNodeTypeBoardConfig(projectId: string, id: string, boardConfig: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const updates: any = { boardConfig };
  if (boardConfig.isSprintEligible !== undefined) {
      updates.isSprintEligible = boardConfig.isSprintEligible;
  }

  await prisma.nodeType.update({ 
      where: { id, userId: session.user.id, projectId }, 
      data: updates 
  });

  revalidatePath(`/project/${projectId}/settings/nodes`);
  revalidatePath(`/project/${projectId}/board`);
}
