"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { serializeData } from "@/lib/utils";

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
  const children = node?.childLinks.map((l: any) => l.childNode) || [];
  return serializeData(children);
}

export async function getRootNodes(projectId: string, showArchived: boolean = false) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const nodes = await prisma.node.findMany({
    where: { userId: session.user.id, projectId, parentLinks: { none: {} }, isArchived: showArchived ? undefined : false },
    include: {
      type: { include: { fields: true } },
      childLinks: { include: { childNode: { include: { type: { include: { fields: true } }, sprint: true } } } },
      blockedBy: { include: { blockingNode: true } },
      blocking: { include: { blockedNode: true } },
      sprint: true
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
      blockedBy: { include: { blockingNode: true } },
      sprint: true
    }
  });
  return serializeData(nodes);
}
