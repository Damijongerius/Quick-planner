"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { publishChange } from "@/lib/realtime/hub";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/lib/utils";
import { requireProjectAccess, getProjectViewerId, logHistoryEvent, cleanName, toResult, UserError, type ActionResult } from "./helpers";
import { FIELD_TYPES } from "@/lib/constants";
import { NodeType, BoardConfig } from "@/lib/types";

const MAX_STYLE_LENGTH = 64;

function cleanStyle(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.trim().slice(0, MAX_STYLE_LENGTH);
}

export async function createNodeType(projectId: string, formData: FormData) {
  const userId = await requireProjectAccess(projectId);
  const name = cleanName(formData.get("name"), "Node type name");
  const color = cleanStyle(formData.get("color"), "#3b82f6");
  const icon = cleanStyle(formData.get("icon"), "Target");

  await prisma.$transaction(async (tx) => {
    await tx.nodeType.create({ data: { name, color, icon, userId, projectId } });
    await logHistoryEvent({ projectId, action: 'CREATE', entityType: 'NODETYPE', entityName: name, userId }, tx);
  });
  revalidatePath(`/project/${projectId}/settings/nodes`);
  publishChange(projectId, "types", userId);
}

export async function updateNodeType(projectId: string, id: string, name: string, color: string, icon: string, isSprintEligible: boolean = true) {
  const userId = await requireProjectAccess(projectId);
  const result = await prisma.nodeType.updateMany({
    where: { id, projectId },
    data: {
      name: cleanName(name, "Node type name"),
      color: cleanStyle(color, "#3b82f6"),
      icon: cleanStyle(icon, "Target"),
      isSprintEligible: Boolean(isSprintEligible),
    },
  });
  if (result.count === 0) throw new Error("Node type not found");
  revalidatePath(`/project/${projectId}/settings/nodes`);
  publishChange(projectId, "types", userId);
}

export async function deleteNodeType(projectId: string, id: string): Promise<ActionResult> {
  const userId = await requireProjectAccess(projectId);

  const result = await toResult(() => prisma.$transaction(async (tx) => {
    const nodeType = await tx.nodeType.findFirst({ where: { id, projectId }, select: { name: true } });
    if (!nodeType) return;

    // Node.type has no cascade, so give a readable error instead of a raw FK violation.
    const inUse = await tx.node.count({ where: { nodeTypeId: id } });
    if (inUse > 0) {
      throw new UserError(`Cannot delete "${nodeType.name}": ${inUse} node(s) still use this type`);
    }
    await tx.nodeType.delete({ where: { id } });
    await logHistoryEvent({ projectId, action: 'DELETE', entityType: 'NODETYPE', entityName: nodeType.name, userId }, tx);
  }));
  if (!result.error) revalidatePath(`/project/${projectId}/settings/nodes`);
  return result;
}

export async function addFieldDefinition(projectId: string, nodeTypeId: string, name: string, type: string, options?: unknown[]): Promise<ActionResult> {
  const userId = await requireProjectAccess(projectId);
  const fieldName = cleanName(name, "Field name");
  if (!(FIELD_TYPES as readonly string[]).includes(type)) throw new Error(`Invalid field type: ${type}`);
  if (type === "SELECT" && (!Array.isArray(options) || options.length === 0)) {
    throw new Error("A select field needs at least one option");
  }

  const result = await toResult(() => prisma.$transaction(async (tx) => {
    const nodeType = await tx.nodeType.findFirst({ where: { id: nodeTypeId, projectId }, select: { id: true } });
    if (!nodeType) throw new Error("Node type not found");

    // Node content is keyed by field name, so names must be unique per type.
    const duplicate = await tx.fieldDefinition.findFirst({
      where: { nodeTypeId, name: { equals: fieldName, mode: "insensitive" } },
      select: { id: true }
    });
    if (duplicate) throw new UserError(`A field named "${fieldName}" already exists`);

    await tx.fieldDefinition.create({
      data: { nodeTypeId, name: fieldName, type, options: (options ?? []) as Prisma.InputJsonValue }
    });
  }));
  if (!result.error) revalidatePath(`/project/${projectId}/settings/nodes`);
  return result;
}

export async function removeFieldDefinition(projectId: string, id: string) {
  const userId = await requireProjectAccess(projectId);
  await prisma.fieldDefinition.deleteMany({
    where: { id, nodeType: { projectId } }
  });
  revalidatePath(`/project/${projectId}/settings/nodes`);
  publishChange(projectId, "types", userId);
}

export async function getNodeTypes(projectId: string): Promise<NodeType[]> {
  const userId = await getProjectViewerId(projectId);
  if (!userId) return [];
  const nodeTypes = await prisma.nodeType.findMany({
    where: { projectId },
    include: { fields: true, allowedChildren: { include: { childNodeTypeType: true } } },
    orderBy: { createdAt: "asc" },
  });
  return serializeData(nodeTypes) as NodeType[];
}

export async function updateNodeTypeBoardConfig(projectId: string, id: string, boardConfig: BoardConfig) {
  const userId = await requireProjectAccess(projectId);
  if (typeof boardConfig !== "object" || boardConfig === null) throw new Error("Invalid board config");

  const data: Prisma.NodeTypeUpdateManyMutationInput = { boardConfig: boardConfig as Prisma.InputJsonValue };
  if (boardConfig.isSprintEligible !== undefined) {
    data.isSprintEligible = Boolean(boardConfig.isSprintEligible);
  }

  const result = await prisma.nodeType.updateMany({ where: { id, projectId }, data });
  if (result.count === 0) throw new Error("Node type not found");

  revalidatePath(`/project/${projectId}/settings/nodes`);

  publishChange(projectId, "types", userId);
  revalidatePath(`/project/${projectId}/board`);
}
