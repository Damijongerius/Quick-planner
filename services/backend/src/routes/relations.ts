import { Router } from "express";
import prisma from "../lib/db";
import { verifyToken } from "../middleware/auth";
import { ensureProjectNotArchived } from "../lib/helpers";

const router = Router();

router.use(verifyToken);

// Get relations (AllowedRelation) for a project
router.get("/projects/:projectId/relations", async (req, res) => {
  try {
    const { projectId } = req.params;

    const relations = await prisma.allowedRelation.findMany({
      where: { parentNodeType: { projectId } },
      include: { parentNodeType: true, childNodeTypeType: true },
    });

    res.json(relations);
  } catch (error: any) {
    console.error("Get relations error:", error);
    res.status(500).json({ error: "Failed to fetch relations" });
  }
});

// Create allowed relation
router.post("/projects/:projectId/relations", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { parentNodeTypeId, childNodeTypeId } = req.body;

    if (!parentNodeTypeId || !childNodeTypeId) {
      res.status(400).json({ error: "parentNodeTypeId and childNodeTypeId are required" });
      return;
    }

    await ensureProjectNotArchived(projectId);

    const existingRelation = await prisma.allowedRelation.findFirst({
      where: { parentNodeTypeId, childNodeTypeId }
    });

    if (existingRelation) {
      res.status(200).json(existingRelation);
      return;
    }

    const relation = await prisma.allowedRelation.create({
      data: { parentNodeTypeId, childNodeTypeId },
    });

    res.status(201).json(relation);
  } catch (error: any) {
    if (error.code === "P2002") {
      const { parentNodeTypeId, childNodeTypeId } = req.body;
      const existing = await prisma.allowedRelation.findFirst({
        where: { parentNodeTypeId, childNodeTypeId }
      });
      if (existing) {
        res.status(200).json(existing);
        return;
      }
    }
    console.error("Create relation error:", error);
    res.status(500).json({ error: error.message || "Failed to create relation" });
  }
});

// Delete allowed relation
router.delete("/projects/:projectId/relations/:id", async (req, res) => {
  try {
    const { projectId, id } = req.params;

    await ensureProjectNotArchived(projectId);

    try {
      await prisma.allowedRelation.delete({
        where: { id },
      });
      res.json({ message: "Relation deleted" });
    } catch (err: any) {
      if (err.code === "P2025") {
        res.status(404).json({ error: "Relation not found" });
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    console.error("Delete relation error:", error);
    res.status(500).json({ error: error.message || "Failed to delete relation" });
  }
});

// Add node dependency (blockedNodeId depends on blockingNodeId)
router.post("/projects/:projectId/dependencies", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { blockedNodeId, blockingNodeId } = req.body;

    if (!blockedNodeId || !blockingNodeId) {
      res.status(400).json({ error: "blockedNodeId and blockingNodeId are required" });
      return;
    }

    if (blockedNodeId === blockingNodeId) {
      res.status(400).json({ error: "A node cannot depend on itself" });
      return;
    }

    await ensureProjectNotArchived(projectId);

    const existingDependency = await prisma.nodeDependency.findFirst({
      where: { blockedNodeId, blockingNodeId }
    });

    if (existingDependency) {
      res.status(200).json(existingDependency);
      return;
    }

    const dependency = await prisma.nodeDependency.create({
      data: { blockedNodeId, blockingNodeId },
    });

    res.status(201).json(dependency);
  } catch (error: any) {
    console.error("Add dependency error:", error);
    res.status(500).json({ error: error.message || "Failed to add dependency" });
  }
});

// Remove node dependency
router.delete("/projects/:projectId/dependencies/:id", async (req, res) => {
  try {
    const { projectId, id } = req.params;

    await ensureProjectNotArchived(projectId);

    try {
      await prisma.nodeDependency.delete({
        where: { id },
      });
      res.json({ message: "Dependency removed" });
    } catch (err: any) {
      if (err.code === "P2025") {
        res.status(404).json({ error: "Dependency not found" });
      } else {
        throw err;
      }
    }
  } catch (error: any) {
    console.error("Remove dependency error:", error);
    res.status(500).json({ error: error.message || "Failed to remove dependency" });
  }
});

export default router;
