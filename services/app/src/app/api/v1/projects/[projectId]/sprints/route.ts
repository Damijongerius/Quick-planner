import { ApiError, route } from "@/lib/api/handler";
import { getSprints } from "@/lib/actions";
import { getProjectAccess } from "@/lib/actions/helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = route<{ projectId: string }>(async ({ params }) => {
  if (!(await getProjectAccess(params.projectId))) throw new ApiError(404, "not_found", "Project not found.");
  const sprints = await getSprints(params.projectId);
  return { sprints: sprints.map((s) => ({ id: s.id, name: s.name, status: s.status, startDate: s.startDate ? String(s.startDate).slice(0, 10) : null, endDate: s.endDate ? String(s.endDate).slice(0, 10) : null, capacity: s.capacity ?? null, itemCount: s._count.nodes, doneCount: s.doneCount })) };
});
