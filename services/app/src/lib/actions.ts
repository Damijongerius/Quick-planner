"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { serializeData } from "./utils";

export async function createNodeType(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const icon = formData.get("icon") as string || "Target";

  await prisma.nodeType.create({
    data: {
      name,
      color,
      icon,
      userId: session.user.id,
    },
  });

  revalidatePath("/settings/nodes");
}

export async function updateNodeType(id: string, name: string, color: string, icon: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.nodeType.update({
    where: { id, userId: session.user.id },
    data: { name, color, icon },
  });

  revalidatePath("/settings/nodes");
}

export async function deleteNodeType(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    await prisma.nodeType.delete({
      where: { id, userId: session.user.id },
    });
  } catch (error: any) {
    if (error.code !== 'P2025') throw error;
  }

  revalidatePath("/settings/nodes");
}

export async function addFieldDefinition(nodeTypeId: string, name: string, type: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.fieldDefinition.create({
    data: {
      nodeTypeId,
      name,
      type,
    },
  });

  revalidatePath("/settings/nodes");
}

export async function removeFieldDefinition(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    await prisma.fieldDefinition.delete({
      where: { id },
    });
  } catch (error: any) {
    if (error.code !== 'P2025') throw error;
  }

  revalidatePath("/settings/nodes");
}

export async function createRelation(parentNodeTypeId: string, childNodeTypeId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.allowedRelation.create({
    data: {
      parentNodeTypeId,
      childNodeTypeId,
    },
  });

  revalidatePath("/settings/relations");
}

export async function deleteRelation(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    await prisma.allowedRelation.delete({
      where: { id },
    });
  } catch (error: any) {
    if (error.code !== 'P2025') throw error;
  }

  revalidatePath("/settings/relations");
}

export async function getRelations() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await prisma.allowedRelation.findMany({
    include: {
      parentNodeType: true,
      childNodeTypeType: true,
    },
  });
}

export async function createNode(parentNodeId: string | null, nodeTypeId: string, title: string, content: any = {}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const newNode = await prisma.node.create({
    data: {
      userId: session.user.id,
      nodeTypeId,
      title,
      content,
    },
  });

  if (parentNodeId) {
    const parentNode = await prisma.node.findUnique({
      where: { id: parentNodeId },
      include: { type: true }
    });

    if (!parentNode) throw new Error("Parent node not found");

    const isAllowed = await prisma.allowedRelation.findFirst({
      where: {
        parentNodeTypeId: parentNode.nodeTypeId,
        childNodeTypeId: nodeTypeId
      }
    });

    if (!isAllowed) throw new Error(`Cannot add this type of node under a ${parentNode.type.name}`);

    await prisma.nodeLink.create({
      data: {
        parentNodeId,
        childNodeId: newNode.id,
      },
    });
  }

  revalidatePath("/backlog");
  revalidatePath("/planner");
  return newNode;
}

export async function updateNode(id: string, updates: { title?: string, content?: any, status?: string, isArchived?: boolean }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.node.update({
    where: { id, userId: session.user.id },
    data: updates,
  });

  revalidatePath("/backlog");
  revalidatePath("/board");
}

export async function deleteNode(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    await prisma.node.delete({
      where: { id, userId: session.user.id },
    });
  } catch (error: any) {
    if (error.code !== 'P2025') throw error;
  }

  revalidatePath("/backlog");
  revalidatePath("/planner");
}

export async function getRootNodes(showArchived: boolean = false) {
  const session = await auth();
  if (!session?.user?.id) return [];

  // Nodes that are not children of any other node
  const nodes = await prisma.node.findMany({
    where: {
      userId: session.user.id,
      parentLinks: { none: {} },
      isArchived: showArchived ? undefined : false
    },
    include: {
      type: {
        include: { fields: true }
      },
      childLinks: {
        include: {
          childNode: {
            include: { 
              type: {
                include: { fields: true }
              } 
            }
          }
        }
      },
      blockedBy: {
        include: { blockingNode: true }
      },
      blocking: {
        include: { blockedNode: true }
      }
    }
  });

  return serializeData(nodes);
}

export async function getNodeChildren(nodeId: string) {
  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    include: {
      childLinks: {
        include: {
          childNode: {
            include: { 
              type: {
                include: { fields: true }
              } 
            }
          }
        }
      }
    }
  });
  
  const children = node?.childLinks.map(l => l.childNode) || [];
  return serializeData(children);
}

export async function getAllNodes() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const nodes = await prisma.node.findMany({
    where: { userId: session.user.id },
    select: { id: true, title: true }
  });

  return serializeData(nodes);
}

export async function getNodeTypes() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const nodeTypes = await prisma.nodeType.findMany({
    where: { userId: session.user.id },
    include: { 
      fields: true,
      allowedChildren: {
        include: {
          childNodeTypeType: true
        }
      }
    },
    orderBy: { createdAt: "asc" },
  });

  return serializeData(nodeTypes);
}

// Sprint Actions
export async function createSprint(name: string, startDate?: string, endDate?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const sprint = await prisma.sprint.create({
    data: {
      name,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      userId: session.user.id,
    },
  });

  revalidatePath("/sprints");
  return serializeData(sprint);
}

export async function getSprints() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const sprints = await prisma.sprint.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { nodes: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return serializeData(sprints);
}

export async function updateSprintStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // If activating, deactivate others
  if (status === "ACTIVE") {
    await prisma.sprint.updateMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      data: { status: "PLANNED" }
    });
  }

  await prisma.sprint.update({
    where: { id, userId: session.user.id },
    data: { status },
  });

  revalidatePath("/sprints");
  revalidatePath("/board");
}

export async function getActiveSprint() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sprint = await prisma.sprint.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: {
      nodes: {
        include: {
          type: true,
          blockedBy: {
            include: { blockingNode: true }
          }
        }
      }
    }
  });

  return serializeData(sprint);
}

// Node State & Assignment Actions
export async function updateNodeStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.node.update({
    where: { id, userId: session.user.id },
    data: { status },
  });

  revalidatePath("/board");
  revalidatePath("/backlog");
}

export async function assignNodeToSprint(nodeId: string, sprintId: string | null) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.node.update({
    where: { id: nodeId, userId: session.user.id },
    data: { sprintId },
  });

  revalidatePath("/backlog");
  revalidatePath("/board");
}

export async function archiveNode(id: string, isArchived: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.node.update({
    where: { id, userId: session.user.id },
    data: { isArchived },
  });

  revalidatePath("/backlog");
}

export async function duplicateNode(nodeId: string, parentId: string | null = null) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const sourceNode = await prisma.node.findUnique({
    where: { id: nodeId },
    include: {
      childLinks: {
        include: { childNode: true }
      }
    }
  });

  if (!sourceNode) throw new Error("Node not found");

  // Create the new node
  const newNode = await prisma.node.create({
    data: {
      userId: session.user.id,
      nodeTypeId: sourceNode.nodeTypeId,
      title: `${sourceNode.title} (Copy)`,
      content: sourceNode.content || {},
      status: "TODO",
      isArchived: false,
    },
  });

  // If there's a parent, link it
  if (parentId) {
    await prisma.nodeLink.create({
      data: {
        parentNodeId: parentId,
        childNodeId: newNode.id,
      }
    });
  } else {
     // Check if the original node has a parent we should also link to
     const originalLink = await prisma.nodeLink.findFirst({
       where: { childNodeId: nodeId }
     });
     if (originalLink) {
       await prisma.nodeLink.create({
         data: {
           parentNodeId: originalLink.parentNodeId,
           childNodeId: newNode.id,
         }
       });
     }
  }

  // Recursively duplicate children
  for (const link of sourceNode.childLinks) {
    await duplicateNode(link.childNodeId, newNode.id);
  }

  revalidatePath("/backlog");
  return serializeData(newNode);
}

// Dependency Actions
export async function addDependency(blockedNodeId: string, blockingNodeId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (blockedNodeId === blockingNodeId) throw new Error("A node cannot depend on itself");

  await prisma.nodeDependency.create({
    data: {
      blockedNodeId,
      blockingNodeId,
    },
  });

  revalidatePath("/backlog");
  revalidatePath("/board");
}

export async function removeDependency(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    await prisma.nodeDependency.delete({
      where: { id },
    });
  } catch (error: any) {
    if (error.code !== 'P2025') throw error;
  }

  revalidatePath("/backlog");
  revalidatePath("/board");
}

export async function getBoardData(sprintId: string, nodeTypeId?: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const nodes = await prisma.node.findMany({
    where: {
      userId: session.user.id,
      sprintId: sprintId,
      nodeTypeId: nodeTypeId || undefined,
      isArchived: false,
    },
    include: {
      type: {
        include: { fields: true }
      },
      parentLinks: {
        include: {
          parentNode: {
            include: { type: true }
          }
        }
      },
      blockedBy: {
        include: { blockingNode: true }
      }
    }
  });

  return serializeData(nodes);
}

export async function updateNodeTypeBoardConfig(id: string, boardConfig: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.nodeType.update({
    where: { id, userId: session.user.id },
    data: { boardConfig },
  });

  revalidatePath("/settings/nodes");
  revalidatePath("/board");
}

export async function getNode(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const node = await prisma.node.findUnique({
    where: { id, userId: session.user.id },
    include: {
      type: {
        include: { fields: true }
      },
      parentLinks: {
        include: {
          parentNode: {
            include: { type: true }
          }
        }
      },
      childLinks: {
        include: {
          childNode: {
            include: { type: true }
          }
        }
      },
      blockedBy: {
        include: { blockingNode: true }
      },
      blocking: {
        include: { blockedNode: true }
      }
    }
  });

  if (!node) return null;
  return serializeData(node);
}
