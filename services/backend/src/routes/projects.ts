import { Router } from "express";
import prisma from "../lib/db";
import { verifyToken } from "../middleware/auth";
import { logHistoryEvent } from "../lib/helpers";

const router = Router();

router.use(verifyToken);

// List projects (both archived and unarchived)
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    res.json(projects);
  } catch (error: any) {
    console.error("List projects error:", error);
    res.status(500).json({ error: "Failed to list projects" });
  }
});

// Get single project
router.get("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.json(project);
  } catch (error: any) {
    console.error("Get project error:", error);
    res.status(500).json({ error: "Failed to get project" });
  }
});

// Create project
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ error: "Project name is required" });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name,
        userId,
      },
    });

    // Create default NodeTypes for this project
    await prisma.nodeType.createMany({
      data: [
        {
          name: "Epic",
          projectId: project.id,
          userId,
          color: "#ec4899",
          icon: "Flag",
          isSprintEligible: false,
        },
        {
          name: "Story",
          projectId: project.id,
          userId,
          color: "#3b82f6",
          icon: "BookOpen",
          isSprintEligible: true,
        },
        {
          name: "Task",
          projectId: project.id,
          userId,
          color: "#10b981",
          icon: "CheckSquare",
          isSprintEligible: true,
        },
      ],
    });

    await logHistoryEvent(userId, project.id, {
      action: "CREATE",
      entityType: "PROJECT",
      entityName: name,
    });

    res.status(201).json(project);
  } catch (error: any) {
    console.error("Create project error:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Update project (including archiving / unarchiving)
router.put("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { name, isArchived } = req.body;

    const existingProject = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!existingProject) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        isArchived: isArchived !== undefined ? isArchived : undefined,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete project
router.delete("/:id", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const existingProject = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!existingProject) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    await prisma.project.delete({
      where: { id },
    });

    res.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Get project history
router.get("/:projectId/history", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId } = req.params;
    const history = await prisma.historyEvent.findMany({
      where: { projectId, userId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, image: true } } },
      take: 100,
    });
    res.json(history);
  } catch (error: any) {
    console.error("Get project history error:", error);
    res.status(500).json({ error: "Failed to fetch project history" });
  }
});

// Get node history
router.get("/:projectId/nodes/:nodeId/history", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, nodeId } = req.params;
    const history = await prisma.historyEvent.findMany({
      where: { projectId, nodeId, userId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, image: true } } },
    });
    res.json(history);
  } catch (error: any) {
    console.error("Get node history error:", error);
    res.status(500).json({ error: "Failed to fetch node history" });
  }
});

export default router;
