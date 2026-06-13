import { Router } from "express";
import prisma from "../../lib/db";
import { 
  ensureProjectNotArchived, 
  logHistoryEvent, 
  propagateStatusUpwards, 
  propagateTimelineShift 
} from "../../lib/helpers";

const router = Router();

// Recursion helper to get recursive children IDs for archiving
async function getRecursiveChildIds(
  projectId: string, 
  nodeId: string, 
  userId: string
): Promise<string[]> {
  const links = await prisma.nodeLink.findMany({
    where: { 
      parentNodeId: nodeId, 
      childNode: { projectId, userId, isArchived: false } 
    },
    select: { childNodeId: true }
  });
  const childIds = links.map(l => l.childNodeId);
  let descendantIds = [...childIds];
  for (const childId of childIds) {
    const subIds = await getRecursiveChildIds(projectId, childId, userId);
    descendantIds = [...descendantIds, ...subIds];
  }
  return descendantIds;
}

// 6. Update node
router.put("/projects/:projectId/nodes/:id", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, id } = req.params;
    const updates = req.body;

    await ensureProjectNotArchived(projectId);

    const oldNode = await prisma.node.findUnique({ 
      where: { id, userId, projectId } 
    });

    if (!oldNode) {
      res.status(404).json({ error: "Node not found" });
      return;
    }

    const data: Record<string, any> = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.isArchived !== undefined) data.isArchived = updates.isArchived;
    if (updates.startDate !== undefined) data.startDate = updates.startDate ? new Date(updates.startDate) : null;
    if (updates.endDate !== undefined) data.endDate = updates.endDate ? new Date(updates.endDate) : null;
    
    if (updates.content !== undefined) {
      data.content = {
        ...(oldNode.content as Record<string, any> || {}),
        ...updates.content
      };
    }

    const node = await prisma.node.update({ 
      where: { id, userId, projectId }, 
      data 
    });

    if (updates.status && updates.status !== oldNode.status) {
      await propagateStatusUpwards(userId, projectId, id, updates.status);
      await logHistoryEvent(userId, projectId, {
        nodeId: id,
        action: "STATUS_CHANGE",
        entityType: "NODE",
        entityName: node.title,
        oldValue: oldNode.status,
        newValue: updates.status,
      });
    }
    if (updates.endDate && (!oldNode.endDate || new Date(updates.endDate).getTime() !== oldNode.endDate.getTime())) {
      await propagateTimelineShift(userId, projectId, id);
    }
    if (updates.title && updates.title !== oldNode.title) {
      await logHistoryEvent(userId, projectId, {
        nodeId: id,
        action: "UPDATE",
        entityType: "NODE",
        entityName: node.title,
        oldValue: oldNode.title,
        newValue: updates.title
      });
    }

    res.json(node);
  } catch (error: any) {
    console.error("Update node error:", error);
    res.status(500).json({ error: error.message || "Failed to update node" });
  }
});

// 8. Archive node (with optional children archiving)
router.put("/projects/:projectId/nodes/:id/archive", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, id } = req.params;
    const { isArchived, archiveChildren } = req.body;

    if (isArchived === undefined) {
      res.status(400).json({ error: "isArchived is required" });
      return;
    }

    await ensureProjectNotArchived(projectId);

    if (isArchived && archiveChildren) {
      const descendantIds = await getRecursiveChildIds(projectId, id, userId);
      const allIds = [id, ...descendantIds];
      
      await prisma.node.updateMany({
        where: {
          id: { in: allIds },
          userId,
          projectId
        },
        data: { isArchived: true }
      });

      const updatedNodes = await prisma.node.findMany({
        where: { id: { in: allIds } },
        select: { id: true, title: true }
      });

      for (const n of updatedNodes) {
        await logHistoryEvent(userId, projectId, {
          nodeId: n.id,
          action: "ARCHIVE",
          entityType: "NODE",
          entityName: n.title
        });
      }
      
      res.json({ message: "Nodes archived successfully", count: allIds.length });
    } else {
      const node = await prisma.node.update({ 
        where: { id, userId, projectId }, 
        data: { isArchived } 
      });
      await logHistoryEvent(userId, projectId, {
        nodeId: id,
        action: isArchived ? "ARCHIVE" : "RESTORE",
        entityType: "NODE",
        entityName: node.title
      });
      
      res.json(node);
    }
  } catch (error: any) {
    console.error("Archive node error:", error);
    res.status(500).json({ error: error.message || "Failed to archive node" });
  }
});

// 9. Update parent link of a node
router.put("/projects/:projectId/nodes/:nodeId/parent", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, nodeId } = req.params;
    const { newParentNodeId } = req.body; // Can be null

    await ensureProjectNotArchived(projectId);
    
    // Get current parent info first (before we delete)
    const currentParentLink = await prisma.nodeLink.findFirst({
      where: { childNodeId: nodeId, parentNode: { projectId } },
      include: { parentNode: true }
    });

    // Delete existing links for this child node
    await prisma.nodeLink.deleteMany({
      where: { 
        childNodeId: nodeId, 
        parentNode: { projectId } 
      }
    });

    const childNode = await prisma.node.findUnique({ 
      where: { id: nodeId, userId, projectId }, 
      select: { title: true } 
    });

    if (!childNode) {
      res.status(404).json({ error: "Node not found" });
      return;
    }

    // Create new link if a parent is specified
    if (newParentNodeId) {
      await prisma.nodeLink.create({
        data: { parentNodeId: newParentNodeId, childNodeId: nodeId }
      });
      
      const parentNode = await prisma.node.findUnique({ 
        where: { id: newParentNodeId, projectId }, 
        select: { title: true } 
      });
      
      await logHistoryEvent(userId, projectId, {
        nodeId,
        action: "UPDATE",
        entityType: "NODE",
        entityName: childNode.title,
        oldValue: currentParentLink?.parentNode?.title || "None",
        newValue: parentNode?.title || newParentNodeId
      });
    } else {
      await logHistoryEvent(userId, projectId, {
        nodeId,
        action: "UPDATE",
        entityType: "NODE",
        entityName: childNode.title,
        oldValue: currentParentLink?.parentNode?.title || "None",
        newValue: "None (Unparented)"
      });
    }

    res.json({ message: "Node parent updated successfully" });
  } catch (error: any) {
    console.error("Update node parent error:", error);
    res.status(500).json({ error: error.message || "Failed to update node parent" });
  }
});

export default router;
