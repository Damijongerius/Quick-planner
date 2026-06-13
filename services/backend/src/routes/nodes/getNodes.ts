import { Router } from "express";
import prisma from "../../lib/db";

const router = Router();

// 1. Get single node
router.get("/projects/:projectId/nodes/:id", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, id } = req.params;

    const node = await prisma.node.findUnique({
      where: { id, userId, projectId },
      include: {
        type: { include: { fields: true } },
        parentLinks: { include: { parentNode: { include: { type: true } } } },
        childLinks: { include: { childNode: { include: { type: true } } } },
        blockedBy: { include: { blockingNode: { include: { type: true } } } },
        blocking: { include: { blockedNode: { include: { type: true } } } }
      }
    });

    if (!node) {
      res.status(404).json({ error: "Node not found" });
      return;
    }

    res.json(node);
  } catch (error: any) {
    console.error("Get node error:", error);
    res.status(500).json({ error: "Failed to fetch node" });
  }
});

// 2. Get node children
router.get("/projects/:projectId/nodes/:nodeId/children", async (req, res) => {
  try {
    const { projectId, nodeId } = req.params;

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

    const children = node?.childLinks.map((l) => l.childNode) || [];
    children.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    res.json(children);
  } catch (error: any) {
    console.error("Get node children error:", error);
    res.status(500).json({ error: "Failed to fetch node children" });
  }
});

// 3. Get root nodes
router.get("/projects/:projectId/nodes-root", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId } = req.params;
    const showArchived = req.query.showArchived === "true";

    const nodes = await prisma.node.findMany({
      where: {
        userId,
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
      orderBy: { createdAt: "asc" },
      include: {
        type: { include: { fields: true } },
        childLinks: { include: { childNode: { include: { type: { include: { fields: true } }, sprint: true } } } },
        blockedBy: { include: { blockingNode: { include: { type: true } } } },
        blocking: { include: { blockedNode: { include: { type: true } } } },
        sprint: true
      }
    });

    res.json(nodes);
  } catch (error: any) {
    console.error("Get root nodes error:", error);
    res.status(500).json({ error: "Failed to fetch root nodes" });
  }
});

// 4. Get all nodes
router.get("/projects/:projectId/nodes", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId } = req.params;

    const nodes = await prisma.node.findMany({
      where: { userId, projectId },
      include: {
        type: { include: { fields: true } },
        parentLinks: { include: { parentNode: { include: { type: true } } } },
        blockedBy: { include: { blockingNode: { include: { type: true } } } },
        sprint: true
      }
    });

    res.json(nodes);
  } catch (error: any) {
    console.error("Get all nodes error:", error);
    res.status(500).json({ error: "Failed to fetch nodes" });
  }
});

export default router;
