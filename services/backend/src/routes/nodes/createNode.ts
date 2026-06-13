import { Router } from "express";
import prisma from "../../lib/db";
import { ensureProjectNotArchived, logHistoryEvent } from "../../lib/helpers";

const router = Router();

// 5. Create node
router.post("/projects/:projectId/nodes", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId } = req.params;
    const { parentNodeId, nodeTypeId, title, content, sprintId } = req.body;

    if (!nodeTypeId || !title) {
      res.status(400).json({ error: "nodeTypeId and title are required" });
      return;
    }

    await ensureProjectNotArchived(projectId);

    let resolvedNodeTypeId = nodeTypeId;
    const typeExists = await prisma.nodeType.findFirst({
      where: { id: nodeTypeId, projectId }
    });

    if (!typeExists) {
      const typeByName = await prisma.nodeType.findFirst({
        where: {
          projectId,
          name: {
            equals: nodeTypeId,
            mode: "insensitive"
          }
        }
      });
      if (typeByName) {
        resolvedNodeTypeId = typeByName.id;
      } else {
        res.status(400).json({ error: `Node type '${nodeTypeId}' not found in this project` });
        return;
      }
    }

    const newNode = await prisma.node.create({
      data: { 
        userId, 
        projectId, 
        nodeTypeId: resolvedNodeTypeId, 
        title, 
        content: content || {}, 
        sprintId: sprintId || null 
      },
      include: { type: true }
    });

    if (parentNodeId) {
      const parentNode = await prisma.node.findUnique({ 
        where: { id: parentNodeId, projectId }, 
        include: { type: true } 
      });

      if (!parentNode) {
        res.status(404).json({ error: "Parent node not found" });
        return;
      }

      const isAllowed = await prisma.allowedRelation.findFirst({
        where: { parentNodeTypeId: parentNode.nodeTypeId, childNodeTypeId: resolvedNodeTypeId }
      });

      if (!isAllowed) {
        res.status(400).json({ error: `Cannot add this type of node under a ${parentNode.type.name}` });
        return;
      }

      await prisma.nodeLink.create({ 
        data: { parentNodeId, childNodeId: newNode.id } 
      });
    }

    await logHistoryEvent(userId, projectId, {
      nodeId: newNode.id,
      action: "CREATE",
      entityType: "NODE",
      entityName: title,
      newValue: newNode.type.name
    });

    res.status(201).json(newNode);
  } catch (error: any) {
    console.error("Create node error:", error);
    res.status(500).json({ error: error.message || "Failed to create node" });
  }
});

export default router;
