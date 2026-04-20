"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { serializeData } from "./utils";

// Internal Helper for History Logging
async function logHistoryEvent({
    projectId,
    nodeId,
    action,
    entityType,
    entityName,
    oldValue,
    newValue
}: {
    projectId: string;
    nodeId?: string;
    action: string;
    entityType: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return;

    await prisma.historyEvent.create({
        data: {
            userId: session.user.id,
            projectId,
            nodeId,
            action,
            entityType,
            entityName,
            oldValue,
            newValue
        }
    });
}

// Internal Helper for Status Propagation
async function propagateStatusUpwards(projectId: string, nodeId: string, newStatus: string) {
    if (newStatus !== 'IN_PROGRESS' && newStatus !== 'DONE') return;

    const links = await prisma.nodeLink.findMany({
        where: { childNodeId: nodeId },
        include: { parentNode: true }
    });

    for (const link of links) {
        const parent = link.parentNode;
        
        if (newStatus === 'IN_PROGRESS') {
            if (parent.status === 'TODO') {
                await prisma.node.update({
                    where: { id: parent.id },
                    data: { status: 'IN_PROGRESS' }
                });
                await logHistoryEvent({ projectId, nodeId: parent.id, action: 'STATUS_CHANGE', entityType: 'NODE', entityName: parent.title, oldValue: 'TODO', newValue: 'IN_PROGRESS (Auto)' });
                await propagateStatusUpwards(projectId, parent.id, 'IN_PROGRESS');
            }
        } else if (newStatus === 'DONE') {
            const siblings = await prisma.nodeLink.findMany({
                where: { parentNodeId: parent.id },
                include: { childNode: true }
            });
            const allDone = siblings.every(s => s.childNode.status === 'DONE');
            if (allDone && parent.status !== 'DONE') {
                await prisma.node.update({
                    where: { id: parent.id },
                    data: { status: 'DONE' }
                });
                await logHistoryEvent({ projectId, nodeId: parent.id, action: 'STATUS_CHANGE', entityType: 'NODE', entityName: parent.title, oldValue: parent.status, newValue: 'DONE (Auto)' });
                await propagateStatusUpwards(projectId, parent.id, 'DONE');
            }
        }
    }
}

// Internal Helper for Dynamic Timeline Propagation
async function propagateTimelineShift(projectId: string, nodeId: string) {
    const currentNode = await prisma.node.findUnique({
        where: { id: nodeId },
        include: { blocking: { include: { blockedNode: true } } }
    });

    if (!currentNode || !currentNode.endDate) return;

    for (const dep of currentNode.blocking) {
        const blockedNode = dep.blockedNode;
        if (!blockedNode.startDate || !blockedNode.endDate) continue;

        const duration = blockedNode.endDate.getTime() - blockedNode.startDate.getTime();
        const newStart = new Date(currentNode.endDate);
        newStart.setDate(newStart.getDate() + 1);
        newStart.setHours(0, 0, 0, 0);

        const newEnd = new Date(newStart.getTime() + duration);

        if (blockedNode.startDate.getTime() !== newStart.getTime()) {
            await prisma.node.update({
                where: { id: blockedNode.id },
                data: { 
                    startDate: newStart,
                    endDate: newEnd
                }
            });

            await logHistoryEvent({
                projectId,
                nodeId: blockedNode.id,
                action: 'UPDATE',
                entityType: 'NODE',
                entityName: blockedNode.title,
                oldValue: 'Timeline shifted',
                newValue: `Starts ${newStart.toLocaleDateString()} (Auto)`
            });

            await propagateTimelineShift(projectId, blockedNode.id);
        }
    }
}

// Project Actions
export async function getProjects() {
  const session = await auth();
  if (!session?.user?.id) return [];
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return serializeData(projects);
}

export async function getProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
  });
  return serializeData(project);
}

export async function createProject(name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const project = await prisma.project.create({
    data: { name, userId: session.user.id },
  });
  await logHistoryEvent({ projectId: project.id, action: 'CREATE', entityType: 'PROJECT', entityName: name });
  revalidatePath("/projects");
  return serializeData(project);
}

export async function deleteProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.project.delete({ where: { id, userId: session.user.id } });
  revalidatePath("/projects");
}

export async function getProjectHistory(projectId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];
    const history = await prisma.historyEvent.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, image: true } } },
        take: 100
    });
    return serializeData(history);
}

export async function getHistoryForNode(projectId: string, nodeId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];
    const history = await prisma.historyEvent.findMany({
        where: { projectId, nodeId },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, image: true } } }
    });
    return serializeData(history);
}

// Node Type Actions
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

// Relation Actions
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

// Node Actions
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
    title?: string, 
    description?: string, 
    content?: any, 
    status?: string, 
    isArchived?: boolean,
    startDate?: string | Date | null,
    endDate?: string | Date | null
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const oldNode = await prisma.node.findUnique({ where: { id } });
  const data: any = { ...updates };
  if (updates.startDate) data.startDate = new Date(updates.startDate);
  if (updates.endDate) data.endDate = new Date(updates.endDate);

  const node = await prisma.node.update({
    where: { id, userId: session.user.id, projectId },
    data,
  });

  if (updates.status && updates.status !== oldNode?.status) {
      await propagateStatusUpwards(projectId, id, updates.status);
  }

  if (updates.endDate && (!oldNode?.endDate || new Date(updates.endDate).getTime() !== oldNode.endDate.getTime())) {
      await propagateTimelineShift(projectId, id);
  }

  if (updates.title && updates.title !== oldNode?.title) {
      await logHistoryEvent({ projectId, nodeId: id, action: 'UPDATE', entityType: 'NODE', entityName: node.title, oldValue: oldNode?.title, newValue: updates.title });
  }

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
  } catch (error: any) {
    if (error.code !== 'P2025') throw error;
  }
  revalidatePath(`/project/${projectId}/backlog`);
}

export async function getNode(projectId: string, id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const node = await prisma.node.findUnique({
    where: { id, userId: session.user.id, projectId },
    include: {
      type: { include: { fields: true } },
      parentLinks: { include: { parentNode: { include: { type: true } } } },
      childLinks: { include: { childNode: { include: { type: true } } } },
      blockedBy: { include: { blockingNode: true } },
      blocking: { include: { blockedNode: true } }
    }
  });
  if (!node) return null;
  return serializeData(node);
}

export async function getNodeChildren(projectId: string, nodeId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const node = await prisma.node.findUnique({
    where: { id: nodeId, projectId },
    include: {
      childLinks: {
        include: {
          childNode: {
            include: { 
              type: { include: { fields: true } },
              childLinks: { include: { childNode: { include: { type: true } } } }
            }
          }
        }
      }
    }
  });
  const children = node?.childLinks.map(l => l.childNode) || [];
  return serializeData(children);
}

export async function getRootNodes(projectId: string, showArchived: boolean = false) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const nodes = await prisma.node.findMany({
    where: { userId: session.user.id, projectId, parentLinks: { none: {} }, isArchived: showArchived ? undefined : false },
    include: {
      type: { include: { fields: true } },
      childLinks: { include: { childNode: { include: { type: { include: { fields: true } } } } } },
      blockedBy: { include: { blockingNode: true } },
      blocking: { include: { blockedNode: true } }
    }
  });
  return serializeData(nodes);
}

export async function getAllNodes(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const nodes = await prisma.node.findMany({
    where: { userId: session.user.id, projectId },
    include: {
      type: { include: { fields: true } },
      parentLinks: { include: { parentNode: true } },
      blockedBy: { include: { blockingNode: true } }
    }
  });
  return serializeData(nodes);
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

// Sprint Actions
export async function createSprint(projectId: string, name: string, startDate?: string, endDate?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
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
  return serializeData(sprints);
}

export async function updateSprintStatus(projectId: string, id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const oldSprint = await prisma.sprint.findUnique({ where: { id } });
  if (status === "ACTIVE") {
    await prisma.sprint.updateMany({ where: { userId: session.user.id, projectId, status: "ACTIVE" }, data: { status: "PLANNED" } });
  }
  await prisma.sprint.update({ where: { id, userId: session.user.id, projectId }, data: { status }, });
  await logHistoryEvent({ projectId, action: 'STATUS_CHANGE', entityType: 'SPRINT', entityName: oldSprint?.name, oldValue: oldSprint?.status, newValue: status });
  revalidatePath(`/project/${projectId}/sprints`);
  revalidatePath(`/project/${projectId}/board`);
}

// Node State & Assignment Actions
export async function updateNodeStatus(projectId: string, id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const oldNode = await prisma.node.findUnique({ where: { id } });
  await prisma.node.update({ where: { id, userId: session.user.id, projectId }, data: { status }, });
  await propagateStatusUpwards(projectId, id, status);
  await logHistoryEvent({ projectId, nodeId: id, action: 'STATUS_CHANGE', entityType: 'NODE', entityName: oldNode?.title, oldValue: oldNode?.status, newValue: status });
  revalidatePath(`/project/${projectId}/board`);
  revalidatePath(`/project/${projectId}/backlog`);
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

export async function assignNodeToSprint(projectId: string, nodeId: string, sprintId: string | null) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const node = await prisma.node.findUnique({ where: { id: nodeId } });
  const sprint = sprintId ? await prisma.sprint.findUnique({ where: { id: sprintId } }) : null;
  await prisma.node.update({ where: { id: nodeId, userId: session.user.id, projectId }, data: { sprintId }, });
  await logHistoryEvent({ projectId, nodeId, action: 'MOVE', entityType: 'NODE', entityName: node?.title, newValue: sprint?.name || 'Backlog' });
  revalidatePath(`/project/${projectId}/backlog`);
  revalidatePath(`/project/${projectId}/board`);
}

export async function archiveNode(projectId: string, id: string, isArchived: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const node = await prisma.node.update({ where: { id, userId: session.user.id, projectId }, data: { isArchived }, });
  await logHistoryEvent({ projectId, nodeId: id, action: isArchived ? 'ARCHIVE' : 'RESTORE', entityType: 'NODE', entityName: node.title });
  revalidatePath(`/project/${projectId}/backlog`);
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
