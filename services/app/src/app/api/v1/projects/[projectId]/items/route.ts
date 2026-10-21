import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ApiError, json, limitParam, readJson, route } from "@/lib/api/handler";
import { ITEM_INCLUDE, toApiItem } from "@/lib/api/items";
import { createNode, updateNode } from "@/lib/actions";
import { getProjectAccess } from "@/lib/actions/helpers";
import { NODE_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireRead(projectId: string) {
  const access = await getProjectAccess(projectId);
  if (!access) throw new ApiError(404, "not_found", "Project not found.");
  return access;
}

/** List items. Filters: status, assignee (id | me | none), sprint (id | none), type (name or id), q, archived, updatedSince. Paged with limit + cursor. */
export const GET = route<{ projectId: string }>(async ({ params, url, userId }) => {
  await requireRead(params.projectId);
  const q = url.searchParams;
  const where: Prisma.NodeWhereInput = { projectId: params.projectId, isArchived: q.get("archived") === "true" };
  const statuses = q.get("status")?.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (statuses?.length) {
    const bad = statuses.find((s) => !(NODE_STATUSES as readonly string[]).includes(s));
    if (bad) throw new ApiError(400, "invalid_request", `Unknown status “${bad}”. Use ${NODE_STATUSES.join(", ")}.`);
    where.status = { in: statuses };
  }
  const assignee = q.get("assignee");
  if (assignee) where.assigneeId = assignee === "me" ? userId : assignee === "none" ? null : assignee;
  const sprint = q.get("sprint");
  if (sprint) where.sprintId = sprint === "none" ? null : sprint;
  const type = q.get("type");
  if (type) where.type = { projectId: params.projectId, OR: [{ id: type }, { name: { equals: type, mode: "insensitive" } }] };
  const text = q.get("q");
  if (text) where.title = { contains: text.slice(0, 200), mode: "insensitive" };
  const since = q.get("updatedSince");
  if (since) {
    const d = new Date(since);
    if (Number.isNaN(d.getTime())) throw new ApiError(400, "invalid_request", "updatedSince must be an ISO date.");
    where.updatedAt = { gte: d };
  }

  const limit = limitParam(url);
  const cursor = q.get("cursor");
  const rows = await prisma.node.findMany({
    where, include: ITEM_INCLUDE, take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });
  const page = rows.slice(0, limit);
  return { items: page.map(toApiItem), nextCursor: rows.length > limit ? page[page.length - 1].id : null };
});

const str = (v: unknown, name: string): string | undefined => {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") throw new ApiError(400, "invalid_request", `“${name}” must be a string.`);
  return v;
};

/** Create an item. `type` is a type name or id; `parentId`, `sprintId`, `assigneeId`, `status`, `fields`, dates are optional. */
export const POST = route<{ projectId: string }>(async ({ req, params }) => {
  await requireRead(params.projectId);
  const body = await readJson(req);
  const title = str(body.title, "title");
  if (!title?.trim()) throw new ApiError(400, "invalid_request", "“title” is required.");
  const typeRef = str(body.type, "type");
  if (!typeRef) throw new ApiError(400, "invalid_request", "“type” (an item type name or id) is required.");
  const type = await prisma.nodeType.findFirst({ where: { projectId: params.projectId, OR: [{ id: typeRef }, { name: { equals: typeRef, mode: "insensitive" } }] }, select: { id: true } });
  if (!type) throw new ApiError(400, "invalid_request", `There is no item type “${typeRef}” in this project.`);
  if (body.fields !== undefined && (typeof body.fields !== "object" || body.fields === null || Array.isArray(body.fields))) throw new ApiError(400, "invalid_request", "“fields” must be an object.");

  const created = await createNode(params.projectId, str(body.parentId, "parentId") ?? null, type.id, title, (body.fields as Record<string, unknown>) ?? {}, str(body.sprintId, "sprintId") ?? null, str(body.status, "status"));
  const extra: Record<string, unknown> = {};
  for (const key of ["description", "assigneeId", "startDate", "endDate"] as const) if (body[key] !== undefined) extra[key] = body[key];
  if (Object.keys(extra).length > 0) {
    const result = await updateNode(params.projectId, created.id, extra);
    if (result.error) throw new ApiError(400, "invalid_request", result.error);
  }
  const fresh = await prisma.node.findUniqueOrThrow({ where: { id: created.id }, include: ITEM_INCLUDE });
  return json(toApiItem(fresh), 201);
});
