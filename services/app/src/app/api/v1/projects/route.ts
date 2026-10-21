import { route } from "@/lib/api/handler";
import { getProjects } from "@/lib/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Projects the token's owner can see. */
export const GET = route(async () => {
  const projects = await getProjects();
  return { projects: projects.map((p) => ({ id: p.id, name: p.name, role: p.role, archived: p.isArchived })) };
});
