// NOTE: deliberately NOT a "use server" file (internal helper, shared by the export route and templates).

import prisma from "@/lib/db";
import type { OwnExport } from "@/lib/importer/formats";
import type { Blueprint, ImportItem, ItemStatus } from "@/lib/importer/types";

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : undefined);

export async function buildBlueprint(projectId: string): Promise<Blueprint> {
  const types = await prisma.nodeType.findMany({ where: { projectId }, include: { fields: true, allowedChildren: { include: { childNodeTypeType: { select: { name: true } } } } }, orderBy: { createdAt: "asc" } });
  return {
    nodeTypes: types.map((t) => ({
      name: t.name, color: t.color, icon: t.icon, isSprintEligible: t.isSprintEligible,
      boardConfig: (t.boardConfig as Record<string, unknown> | null) ?? null,
      fields: t.fields.map((f) => ({ name: f.name, type: f.type as "TEXT" | "NUMBER" | "DATE" | "CHECKBOX" | "SELECT", required: f.required, options: Array.isArray(f.options) ? (f.options as string[]) : undefined })),
    })),
    relations: types.flatMap((t) => t.allowedChildren.map((r) => ({ parent: t.name, child: r.childNodeTypeType.name }))),
  };
}

/** Everything about a project that can be moved elsewhere, in this app's own format. */
export async function buildOwnExport(projectId: string): Promise<OwnExport | null> {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true } });
  if (!project) return null;
  const [blueprint, sprints, milestones, nodes] = await Promise.all([
    buildBlueprint(projectId),
    prisma.sprint.findMany({ where: { projectId }, orderBy: [{ startDate: "asc" }, { createdAt: "asc" }] }),
    prisma.milestone.findMany({ where: { projectId }, orderBy: { date: "asc" } }),
    prisma.node.findMany({
      where: { projectId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: { type: { select: { name: true } }, assignee: { select: { email: true, name: true } }, sprint: { select: { name: true } }, parentLinks: { select: { parentNodeId: true }, take: 1 }, blockedBy: { select: { blockingNodeId: true } } },
    }),
  ]);

  const items: ImportItem[] = nodes.map((n) => {
    const content = (n.content ?? {}) as Record<string, unknown>;
    const fields: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(content)) if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") fields[k] = v;
    return {
      ref: n.id,
      title: n.title,
      ...(n.description ? { description: n.description } : {}),
      type: n.type.name,
      status: n.status as ItemStatus,
      ...(n.parentLinks[0] ? { parentRef: n.parentLinks[0].parentNodeId } : {}),
      ...(n.assignee ? { assignee: n.assignee.email || n.assignee.name || undefined } : {}),
      ...(n.sprint ? { sprint: n.sprint.name } : {}),
      ...(day(n.startDate) ? { startDate: day(n.startDate) } : {}),
      ...(day(n.endDate) ? { endDate: day(n.endDate) } : {}),
      ...(day(n.completedAt) ? { completedAt: day(n.completedAt) } : {}),
      ...(Object.keys(fields).length > 0 ? { fields } : {}),
      ...(n.blockedBy.length > 0 ? { blockedBy: n.blockedBy.map((b) => b.blockingNodeId) } : {}),
      ...(n.isArchived ? { archived: true } : {}),
    };
  });

  return {
    format: "quick-planner",
    version: 1,
    project: { name: project.name },
    blueprint,
    sprints: sprints.map((s) => ({ name: s.name, startDate: day(s.startDate), endDate: day(s.endDate), status: s.status as "PLANNED" | "ACTIVE" | "COMPLETED", ...(s.capacity != null ? { capacity: s.capacity } : {}) })),
    milestones: milestones.map((m) => ({ name: m.name, date: day(m.date)!, color: m.color, ...(m.description ? { description: m.description } : {}) })),
    items,
  };
}
