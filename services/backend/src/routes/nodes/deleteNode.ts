import { Router } from "express";
import prisma from "../../lib/db";
import { ensureProjectNotArchived, logHistoryEvent } from "../../lib/helpers";

const router = Router();

// 7. Delete node
router.delete("/projects/:projectId/nodes/:id", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, id } = req.params;

    await ensureProjectNotArchived(projectId);

    const node = await prisma.node.findUnique({ 
      where: { id, userId, projectId } 
    });

    if (!node) {
      res.status(404).json({ error: "Node not found" });
      return;
    }

    await prisma.node.delete({ 
      where: { id, userId, projectId } 
    });

    await logHistoryEvent(userId, projectId, {
      action: "DELETE",
      entityType: "NODE",
      entityName: node.title
    });

    res.json({ message: "Node deleted successfully" });
  } catch (error: any) {
    console.error("Delete node error:", error);
    res.status(500).json({ error: error.message || "Failed to delete node" });
  }
});

export default router;
