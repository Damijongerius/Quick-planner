import { Router } from "express";
import prisma from "../lib/db";
import { verifyToken } from "../middleware/auth";
import { logHistoryEvent, ensureProjectNotArchived, cascadeSprintToChildren } from "../lib/helpers";

const router = Router();

router.use(verifyToken);

// Get sprints
router.get("/projects/:projectId/sprints", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId } = req.params;

    const sprints = await prisma.sprint.findMany({
      where: { userId, projectId },
      include: { _count: { select: { nodes: true } } },
      orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
    });

    res.json(sprints);
  } catch (error: any) {
    console.error("Get sprints error:", error);
    res.status(500).json({ error: "Failed to fetch sprints" });
  }
});

// Create sprint
router.post("/projects/:projectId/sprints", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId } = req.params;
    const { name, startDate, endDate } = req.body;

    if (!name) {
      res.status(400).json({ error: "Sprint name is required" });
      return;
    }

    await ensureProjectNotArchived(projectId);

    const sprint = await prisma.sprint.create({
      data: {
        name,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        userId,
        projectId,
      },
    });

    await logHistoryEvent(userId, projectId, {
      action: "CREATE",
      entityType: "SPRINT",
      entityName: name,
    });

    res.status(201).json(sprint);
  } catch (error: any) {
    console.error("Create sprint error:", error);
    res.status(500).json({ error: error.message || "Failed to create sprint" });
  }
});

// Update sprint status
router.put("/projects/:projectId/sprints/:id/status", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: "Status is required" });
      return;
    }

    await ensureProjectNotArchived(projectId);

    const oldSprint = await prisma.sprint.findFirst({
      where: { id, userId, projectId },
    });

    if (!oldSprint) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    if (status === "ACTIVE") {
      // Set any existing ACTIVE sprints to PLANNED
      await prisma.sprint.updateMany({
        where: { userId, projectId, status: "ACTIVE" },
        data: { status: "PLANNED" },
      });
    }

    const updated = await prisma.sprint.update({
      where: { id, userId, projectId },
      data: { status },
    });

    await logHistoryEvent(userId, projectId, {
      action: "STATUS_CHANGE",
      entityType: "SPRINT",
      entityName: oldSprint.name,
      oldValue: oldSprint.status,
      newValue: status,
    });

    res.json(updated);
  } catch (error: any) {
    console.error("Update sprint status error:", error);
    res.status(500).json({ error: error.message || "Failed to update sprint status" });
  }
});

// Delete sprint
router.delete("/projects/:projectId/sprints/:id", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, id } = req.params;

    await ensureProjectNotArchived(projectId);

    const sprint = await prisma.sprint.findFirst({
      where: { id, userId, projectId },
    });

    if (!sprint) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    await prisma.sprint.delete({
      where: { id, userId, projectId },
    });

    await logHistoryEvent(userId, projectId, {
      action: "DELETE",
      entityType: "SPRINT",
      entityName: sprint.name,
    });

    res.json({ message: "Sprint deleted successfully" });
  } catch (error: any) {
    console.error("Delete sprint error:", error);
    res.status(500).json({ error: error.message || "Failed to delete sprint" });
  }
});



// Assign node to sprint
router.put("/projects/:projectId/nodes/:nodeId/sprint", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId, nodeId } = req.params;
    const { sprintId } = req.body; // can be null

    await ensureProjectNotArchived(projectId);

    const node = await prisma.node.findFirst({
      where: { id: nodeId, userId, projectId },
    });

    if (!node) {
      res.status(404).json({ error: "Node not found" });
      return;
    }

    const sprint = sprintId
      ? await prisma.sprint.findFirst({
          where: { id: sprintId, userId, projectId },
        })
      : null;

    if (sprintId && !sprint) {
      res.status(400).json({ error: "Sprint not found or unauthorized" });
      return;
    }

    await prisma.node.update({
      where: { id: nodeId, userId, projectId },
      data: { sprintId },
    });

    await cascadeSprintToChildren(projectId, userId, nodeId, sprintId);

    await logHistoryEvent(userId, projectId, {
      nodeId,
      action: "MOVE",
      entityType: "NODE",
      entityName: node.title,
      newValue: sprint?.name || "Backlog",
    });

    res.json({ message: "Node assigned to sprint successfully" });
  } catch (error: any) {
    console.error("Assign node to sprint error:", error);
    res.status(500).json({ error: error.message || "Failed to assign node to sprint" });
  }
});

export default router;
