import prisma from "@/lib/db";
import { ApiError, route } from "@/lib/api/handler";
import { getProjectAccess } from "@/lib/actions/helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = route<{ projectId: string }>(async ({ params }) => {
  const access = await getProjectAccess(params.projectId);
  if (!access) throw new ApiError(404, "not_found", "Project not found.");
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    select: {
      id: true, name: true, isArchived: true,
      nodeTypes: { select: { id: true, name: true, fields: { select: { name: true, type: true, required: true, options: true } }, allowedChildren: { select: { childNodeTypeType: { select: { name: true } } } } } },
      sprints: { select: { id: true, name: true, status: true, startDate: true, endDate: true, capacity: true }, orderBy: { startDate: "asc" } },
      _count: { select: { nodes: true, members: true } },
    },
  });
  if (!project) throw new ApiError(404, "not_found", "Project not found.");
  return {
    id: project.id, name: project.name, archived: project.isArchived, role: access.role,
    itemCount: project._count.nodes, memberCount: project._count.members + 1,
    types: project.nodeTypes.map((t) => ({ id: t.id, name: t.name, fields: t.fields, canContain: t.allowedChildren.map((c) => c.childNodeTypeType.name) })),
    sprints: project.sprints,
  };
});
