import prisma from "@/lib/db";
import { ApiError, readJson, route } from "@/lib/api/handler";
import { ITEM_INCLUDE, toApiItem } from "@/lib/api/items";
import { assignNodeToSprint, deleteNode, updateNode, updateNodeParent } from "@/lib/actions";
import { getProjectAccess } from "@/lib/actions/helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type P = { projectId: string; itemId: string };

async function load(projectId: string, itemId: string) {
  if (!(await getProjectAccess(projectId))) throw new ApiError(404, "not_found", "Project not found.");
  const node = await prisma.node.findFirst({ where: { id: itemId, projectId }, include: ITEM_INCLUDE });
  if (!node) throw new ApiError(404, "not_found", "Item not found.");
  return node;
}

export const GET = route<P>(async ({ params }) => {
  const node = await load(params.projectId, params.itemId);
  const [children, blocking] = await Promise.all([
    prisma.nodeLink.findMany({ where: { parentNodeId: node.id }, select: { childNodeId: true } }),
    prisma.nodeDependency.findMany({ where: { blockingNodeId: node.id }, select: { blockedNodeId: true } }),
  ]);
  return { ...toApiItem(node), childIds: children.map((c) => c.childNodeId), blockingIds: blocking.map((b) => b.blockedNodeId) };
});

const ALLOWED = ["title", "description", "fields", "status", "archived", "startDate", "endDate", "assigneeId", "sprintId", "parentId"];

/** Change any of: title, description, fields, status, archived, startDate, endDate, assigneeId, sprintId, parentId. */
export const PATCH = route<P>(async ({ req, params }) => {
  await load(params.projectId, params.itemId);
  const body = await readJson(req);
  const unknown = Object.keys(body).filter((k) => !ALLOWED.includes(k));
  if (unknown.length > 0) throw new ApiError(400, "invalid_request", `Unknown field${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}. You can change ${ALLOWED.join(", ")}.`);

  const updates: Record<string, unknown> = {};
  for (const key of ["title", "description", "status", "startDate", "endDate", "assigneeId"] as const) if (body[key] !== undefined) updates[key] = body[key];
  if (body.fields !== undefined) {
    if (typeof body.fields !== "object" || body.fields === null || Array.isArray(body.fields)) throw new ApiError(400, "invalid_request", "“fields” must be an object.");
    updates.content = body.fields;
  }
  if (body.archived !== undefined) updates.isArchived = body.archived === true;
  if (Object.keys(updates).length > 0) {
    const result = await updateNode(params.projectId, params.itemId, updates);
    if (result.error) throw new ApiError(400, "invalid_request", result.error);
  }
  if (body.sprintId !== undefined) await assignNodeToSprint(params.projectId, params.itemId, (body.sprintId as string | null) || null);
  if (body.parentId !== undefined) {
    const result = await updateNodeParent(params.projectId, params.itemId, (body.parentId as string | null) || null);
    if (result.error) throw new ApiError(400, "invalid_request", result.error);
  }
  return toApiItem(await load(params.projectId, params.itemId));
});

export const DELETE = route<P>(async ({ params }) => {
  await load(params.projectId, params.itemId);
  await deleteNode(params.projectId, params.itemId);
  return new Response(null, { status: 204 });
});
