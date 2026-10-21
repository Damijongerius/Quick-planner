"use server";

import prisma from "@/lib/db";
import { requireProjectAccess, getProjectViewerId } from "./helpers";
import { serializeData } from "@/lib/utils";
import { byRank } from "@/lib/order";
import { Node } from "@/lib/types";

const ASSIGNEE = { select: { id: true, name: true, email: true, image: true } } as const;

export async function getNode(projectId: string, id: string) {
  await requireProjectAccess(projectId, { mode: "read" });
  const node = await prisma.node.findFirst({
    where: { id, projectId },
    include: {
      assignee: ASSIGNEE,
      type: { include: { fields: true } },
      parentLinks: { include: { parentNode: { include: { type: true } } } },
      childLinks: { include: { childNode: { include: { type: true } } } },
      blockedBy: { include: { blockingNode: { include: { type: true } } } },
      blocking: { include: { blockedNode: { include: { type: true } } } }
    }
  });
  if (!node) return null;
  return serializeData(node) as Node;
}

export async function getNodeChildren(projectId: string, nodeId: string) {
  const userId = await getProjectViewerId(projectId);
  if (!userId) return [];
  const node = await prisma.node.findFirst({
    where: { id: nodeId, projectId },
    include: {
      childLinks: {
        include: {
          childNode: {
            include: { 
              assignee: ASSIGNEE,
              type: { include: { fields: true } },
              childLinks: { include: { childNode: { include: { type: true } } } }
            }
          }
        }
      }
    }
  });
  const children = node?.childLinks.map((l) => l.childNode) || [];
  children.sort(byRank);
  return serializeData(children) as Node[];
}

export async function getRootNodes(projectId: string, showArchived: boolean = false) {
  const userId = await getProjectViewerId(projectId);
  if (!userId) return [];
  const nodes = await prisma.node.findMany({
    where: {
      projectId,
      isArchived: showArchived,
      OR: showArchived
        ? [
            { parentLinks: { none: {} } },
            { parentLinks: { every: { parentNode: { isArchived: false } } } }
          ]
        : [
            { parentLinks: { none: {} } },
            { parentLinks: { every: { parentNode: { isArchived: true } } } }
          ]
    },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    include: {
      type: { include: { fields: true } },
      assignee: ASSIGNEE,
      _count: { select: { comments: true } },
      childLinks: { include: { childNode: { include: { assignee: ASSIGNEE, _count: { select: { comments: true } }, type: { include: { fields: true } }, sprint: true } } } },
      blockedBy: { include: { blockingNode: { include: { type: true } } } },
      blocking: { include: { blockedNode: { include: { type: true } } } },
      sprint: true
    }
  });
  return serializeData(nodes) as Node[];
}

export async function getAllNodes(projectId: string): Promise<Node[]> {
  const userId = await getProjectViewerId(projectId);
  if (!userId) return [];
  const nodes = await prisma.node.findMany({
    where: { projectId },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    include: {
      type: { include: { fields: true } },
      assignee: ASSIGNEE,
      _count: { select: { comments: true } },
      parentLinks: { include: { parentNode: { include: { type: true } } } },
      blockedBy: { include: { blockingNode: { include: { type: true } } } },
      sprint: true
    }
  });
  return serializeData(nodes) as Node[];
}
