import prisma from "./db";

// Helper for Authorization
export async function ensureProjectNotArchived(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { isArchived: true },
  });
  if (!project) {
    throw new Error(`Project with ID '${projectId}' not found`);
  }
  if (project.isArchived) {
    throw new Error("Cannot modify a decommissioned project");
  }
}

// Helper for History Logging
export async function logHistoryEvent(
  userId: string,
  projectId: string,
  details: {
    nodeId?: string;
    action: string;
    entityType: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
  }
) {
  await prisma.historyEvent.create({
    data: {
      userId,
      projectId,
      nodeId: details.nodeId || null,
      action: details.action,
      entityType: details.entityType,
      entityName: details.entityName || null,
      oldValue: details.oldValue || null,
      newValue: details.newValue || null,
    },
  });
}

// Helper for Status Propagation
export async function propagateStatusUpwards(
  userId: string,
  projectId: string,
  nodeId: string,
  newStatus: string
) {
  if (newStatus !== "IN_PROGRESS" && newStatus !== "DONE") return;

  const links = await prisma.nodeLink.findMany({
    where: { childNodeId: nodeId },
    include: { parentNode: true },
  });

  for (const link of links) {
    const parent = link.parentNode;

    if (newStatus === "IN_PROGRESS") {
      if (parent.status === "TODO") {
        await prisma.node.update({
          where: { id: parent.id },
          data: { status: "IN_PROGRESS" },
        });
        await logHistoryEvent(userId, projectId, {
          nodeId: parent.id,
          action: "STATUS_CHANGE",
          entityType: "NODE",
          entityName: parent.title,
          oldValue: "TODO",
          newValue: "IN_PROGRESS (Auto)",
        });
        await propagateStatusUpwards(userId, projectId, parent.id, "IN_PROGRESS");
      }
    } else if (newStatus === "DONE") {
      const siblings = await prisma.nodeLink.findMany({
        where: { parentNodeId: parent.id },
        include: { childNode: true },
      });
      const allDone = siblings.every((s) => s.childNode.status === "DONE");
      if (allDone && parent.status !== "DONE") {
        await prisma.node.update({
          where: { id: parent.id },
          data: { status: "DONE" },
        });
        await logHistoryEvent(userId, projectId, {
          nodeId: parent.id,
          action: "STATUS_CHANGE",
          entityType: "NODE",
          entityName: parent.title,
          oldValue: parent.status,
          newValue: "DONE (Auto)",
        });
        await propagateStatusUpwards(userId, projectId, parent.id, "DONE");
      }
    }
  }
}

// Helper for Dynamic Timeline Propagation
export async function propagateTimelineShift(
  userId: string,
  projectId: string,
  nodeId: string
) {
  const currentNode = await prisma.node.findUnique({
    where: { id: nodeId },
    include: { blocking: { include: { blockedNode: true } } },
  });

  if (!currentNode?.endDate) return;

  for (const dep of currentNode.blocking) {
    const blockedNode = dep.blockedNode;
    if (!blockedNode.startDate || !blockedNode.endDate) continue;

    const duration =
      blockedNode.endDate.getTime() - blockedNode.startDate.getTime();
    const newStart = new Date(currentNode.endDate);
    newStart.setDate(newStart.getDate() + 1);
    newStart.setHours(0, 0, 0, 0);

    const newEnd = new Date(newStart.getTime() + duration);

    if (blockedNode.startDate.getTime() !== newStart.getTime()) {
      await prisma.node.update({
        where: { id: blockedNode.id },
        data: {
          startDate: newStart,
          endDate: newEnd,
        },
      });

      await logHistoryEvent(userId, projectId, {
        nodeId: blockedNode.id,
        action: "UPDATE",
        entityType: "NODE",
        entityName: blockedNode.title,
        oldValue: "Timeline shifted",
        newValue: `Starts ${newStart.toLocaleDateString()} (Auto)`,
      });

      await propagateTimelineShift(userId, projectId, blockedNode.id);
    }
  }
}

// Helper recursion for assigning child nodes to sprint
export async function cascadeSprintToChildren(
  projectId: string,
  userId: string,
  parentId: string,
  sprintId: string | null
) {
  const links = await prisma.nodeLink.findMany({
    where: { parentNodeId: parentId },
    include: { childNode: true },
  });

  for (const link of links) {
    const child = link.childNode;
    if (child.status === "DONE" || child.isArchived) {
      continue;
    }
    await prisma.node.update({
      where: { id: child.id, userId, projectId },
      data: { sprintId },
    });
    await cascadeSprintToChildren(projectId, userId, child.id, sprintId);
  }
}
