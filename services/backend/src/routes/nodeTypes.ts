import { Router } from "express";
import prisma from "../lib/db";
import { verifyToken } from "../middleware/auth";
import { logHistoryEvent, ensureProjectNotArchived } from "../lib/helpers";

const router = Router();

router.use(verifyToken);

// Get all node types for a project
router.get("/projects/:projectId/node-types", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId } = req.params;

    const nodeTypes = await prisma.nodeType.findMany({
      where: { userId, projectId },
      include: {
        fields: true,
        allowedChildren: { include: { childNodeTypeType: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(nodeTypes);
  } catch (error: any) {
    console.error("Get node types error:", error);
    res.status(500).json({ error: "Failed to fetch node types" });
  }
});

// Create node type
router.post("/projects/:projectId/node-types", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId } = req.params;
    const { name, color, icon } = req.body;

    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    await ensureProjectNotArchived(projectId);

    const nodeType = await prisma.nodeType.create({
      data: {
        name,
        color: color || "#3b82f6",
        icon: icon || "Target",
        userId,
        projectId,
      },
    });

    await logHistoryEvent(userId, projectId, {
      action: "CREATE",
      entityType: "NODETYPE",
      entityName: name,
    });

    res.status(201).json(nodeType);
  } catch (error: any) {
    console.error("Create node type error:", error);
    res.status(500).json({ error: error.message || "Failed to create node type" });
  }
});

// Update node type
router.put("/projects/:projectId/node-types/:id", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, id } = req.params;
    const { name, color, icon, isSprintEligible } = req.body;

    await ensureProjectNotArchived(projectId);

    const updated = await prisma.nodeType.update({
      where: { id, userId, projectId },
      data: {
        name: name !== undefined ? name : undefined,
        color: color !== undefined ? color : undefined,
        icon: icon !== undefined ? icon : undefined,
        isSprintEligible: isSprintEligible !== undefined ? isSprintEligible : undefined,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error("Update node type error:", error);
    res.status(500).json({ error: error.message || "Failed to update node type" });
  }
});

// Delete node type
router.delete("/projects/:projectId/node-types/:id", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, id } = req.params;

    await ensureProjectNotArchived(projectId);

    try {
      await prisma.nodeType.delete({
        where: { id, userId, projectId },
      });
      res.json({ message: "Node type deleted" });
    } catch (err: any) {
      if (err.code === "P2025") {
        res.status(404).json({ error: "Node type not found" });
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    console.error("Delete node type error:", error);
    res.status(500).json({ error: error.message || "Failed to delete node type" });
  }
});

// Add field definition
router.post("/projects/:projectId/node-types/:nodeTypeId/fields", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, nodeTypeId } = req.params;
    const { name, type, options } = req.body;

    if (!name || !type) {
      res.status(400).json({ error: "Name and type are required" });
      return;
    }

    await ensureProjectNotArchived(projectId);

    const field = await prisma.fieldDefinition.create({
      data: {
        nodeTypeId,
        name,
        type,
        options: options || [],
      },
    });

    res.status(201).json(field);
  } catch (error: any) {
    console.error("Add field definition error:", error);
    res.status(500).json({ error: error.message || "Failed to add field definition" });
  }
});

// Delete field definition
router.delete("/projects/:projectId/fields/:id", async (req, res) => {
  try {
    const { projectId, id } = req.params;
    await ensureProjectNotArchived(projectId);
    try {
      await prisma.fieldDefinition.delete({ where: { id } });
      res.json({ message: "Field definition deleted" });
    } catch (err: any) {
      if (err.code === "P2025") {
        res.status(404).json({ error: "Field definition not found" });
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    console.error("Delete field definition error:", error);
    res.status(500).json({ error: error.message || "Failed to delete field definition" });
  }
});

// Update board config for a node type
router.put("/projects/:projectId/node-types/:id/board-config", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, id } = req.params;
    const { boardConfig } = req.body;
    await ensureProjectNotArchived(projectId);
    const updates: Record<string, any> = { boardConfig };
    if (boardConfig && boardConfig.isSprintEligible !== undefined) {
      updates.isSprintEligible = boardConfig.isSprintEligible;
    }
    const updated = await prisma.nodeType.update({
      where: { id, userId, projectId },
      data: updates,
    });
    res.json(updated);
  } catch (error: any) {
    console.error("Update board config error:", error);
    res.status(500).json({ error: error.message || "Failed to update board config" });
  }
});

export default router;
