"use server";

import prisma from "@/lib/db";
import { publishChange } from "@/lib/realtime/hub";
import { currentUserId } from "./context";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/lib/utils";
import { toResult, type ActionResult } from "./helpers";
import { logHistoryEvent, requireUserId, requireProjectAccess, getProjectAccess, getProjectViewerId, accessibleBy, cleanName } from "./helpers";
import { Project } from "@/lib/types";
import { applyBlueprint, runImport } from "./importCore";
import { builtInTemplate, type TemplateConfig } from "@/lib/importer/templates";

export async function getProjects(): Promise<Project[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const projects = await prisma.project.findMany({
    where: accessibleBy(userId),
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { nodes: true, sprints: true, members: true } },
      user: { select: { name: true, email: true } },
    },
  });
  return serializeData(
    projects.map(({ user, ...project }) => ({
      ...project,
      role: project.userId === userId ? "OWNER" : "MEMBER",
      ownerName: project.userId === userId ? null : user.name || user.email,
    }))
  ) as unknown as Project[];
}

/** The project plus what the current user may do in it. Null when they have no access. */
export async function getProject(id: string) {
  const access = await getProjectAccess(id);
  if (!access) return null;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return null;
  return serializeData({ ...project, role: access.role, currentUserId: access.userId });
}

const STARTER_TYPES = [
  { key: "epic", name: "Epic", color: "#7c3aed", icon: "Rocket" },
  { key: "story", name: "Story", color: "#2563eb", icon: "BookOpen" },
  { key: "task", name: "Task", color: "#059669", icon: "CheckSquare" },
] as const;

/**
 * `template`: true seeds the common Epic -> Story -> Task hierarchy; a string is the id of a built-in template
 * ("builtin:software") or of one the user saved; false/omitted starts empty.
 */
export async function createProject(name: string, template: boolean | string = false) {
  const userId = await requireUserId();
  const cleanedName = cleanName(name, "Project name");
  const withTemplate = template === true;
  let config: TemplateConfig | undefined;
  if (typeof template === "string" && template) {
    config = builtInTemplate(template)?.config
      ?? (await prisma.projectTemplate.findFirst({ where: { id: template, userId } }))?.config as unknown as TemplateConfig | undefined;
    if (!config) throw new Error("Template not found");
  }
  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({ data: { name: cleanedName, userId } });
    if (config) {
      await applyBlueprint(tx, { projectId: created.id, userId }, config.blueprint);
      if (config.items && config.items.length > 0) await runImport(tx, { projectId: created.id, userId }, { source: "quick-planner", items: config.items, sprints: [], milestones: [] });
    }

    if (withTemplate) {
      const ids: Record<string, string> = {};
      for (const type of STARTER_TYPES) {
        const nodeType = await tx.nodeType.create({
          data: { name: type.name, color: type.color, icon: type.icon, userId, projectId: created.id },
        });
        ids[type.key] = nodeType.id;
      }
      await tx.allowedRelation.createMany({
        data: [
          { parentNodeTypeId: ids.epic, childNodeTypeId: ids.story },
          { parentNodeTypeId: ids.story, childNodeTypeId: ids.task },
        ],
      });
    }

    await logHistoryEvent({ projectId: created.id, action: 'CREATE', entityType: 'PROJECT', entityName: cleanedName, userId }, tx);
    return created;
  });
  revalidatePath("/projects");
  return serializeData(project);
}

export async function deleteProject(id: string) {
  await requireProjectAccess(id, { mode: "owner" });
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
}

export async function archiveProject(id: string) {
  const userId = await requireProjectAccess(id, { mode: "owner" });
  await prisma.project.update({ where: { id }, data: { isArchived: true } });
  revalidatePath("/projects");
  publishChange(id, "project", userId);
}

export async function unarchiveProject(id: string) {
  const userId = await requireProjectAccess(id, { mode: "owner" });
  await prisma.project.update({ where: { id }, data: { isArchived: false } });
  revalidatePath("/projects");
  revalidatePath(`/project/${id}`, "layout");
  publishChange(id, "project", userId);
}

export async function renameProject(id: string, name: string): Promise<ActionResult> {
  const userId = await requireProjectAccess(id, { mode: "owner" });
  const result = await toResult(async () => {
    const cleaned = cleanName(name, "Project name");
    const existing = await prisma.project.findUnique({ where: { id }, select: { name: true } });
    if (existing?.name === cleaned) return;
    await prisma.$transaction(async (tx) => {
      await tx.project.update({ where: { id }, data: { name: cleaned } });
      await logHistoryEvent({ projectId: id, action: 'UPDATE', entityType: 'PROJECT', entityName: cleaned, oldValue: existing?.name, newValue: cleaned, userId }, tx);
    });
  });
  if (!result.error) {
    revalidatePath("/projects");
    revalidatePath(`/project/${id}`, "layout");
    publishChange(id, "project", userId);
  }
  return result;
}

export async function getProjectHistory(projectId: string, { limit = 100, cursor }: { limit?: number; cursor?: string } = {}) {
    if (!(await getProjectViewerId(projectId))) return [];
    const history = await prisma.historyEvent.findMany({
        where: { projectId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { user: { select: { name: true, image: true } } },
        take: Math.min(Math.max(limit, 1), 200),
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });
    return serializeData(history);
}

export async function getHistoryForNode(projectId: string, nodeId: string) {
    if (!(await getProjectViewerId(projectId))) return [];
    const history = await prisma.historyEvent.findMany({
        where: { projectId, nodeId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { user: { select: { name: true, image: true } } },
        take: 200
    });
    return serializeData(history);
}
