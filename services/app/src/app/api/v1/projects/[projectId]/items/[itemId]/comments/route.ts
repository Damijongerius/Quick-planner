import { ApiError, json, readJson, route } from "@/lib/api/handler";
import { addComment, getComments } from "@/lib/actions";
import { getProjectAccess } from "@/lib/actions/helpers";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type P = { projectId: string; itemId: string };

async function ensure(p: P) {
  if (!(await getProjectAccess(p.projectId))) throw new ApiError(404, "not_found", "Project not found.");
  if (!(await prisma.node.findFirst({ where: { id: p.itemId, projectId: p.projectId }, select: { id: true } }))) throw new ApiError(404, "not_found", "Item not found.");
}

export const GET = route<P>(async ({ params }) => {
  await ensure(params);
  const comments = await getComments(params.projectId, params.itemId);
  return { comments: comments.map((c) => ({ id: c.id, body: c.body, createdAt: c.createdAt, author: { id: c.user.id, name: c.user.name, email: c.user.email } })) };
});

/** Add a comment (viewers may comment too). Mention someone by writing their name; mentions with notifications are made in the app. */
export const POST = route<P>(async ({ req, params }) => {
  await ensure(params);
  const body = await readJson(req);
  if (typeof body.body !== "string") throw new ApiError(400, "invalid_request", "“body” (the comment text) is required.");
  const result = await addComment(params.projectId, params.itemId, body.body);
  if (result.error) throw new ApiError(400, "invalid_request", result.error);
  return json({ ok: true }, 201);
});
