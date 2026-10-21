// Shared plumbing for /api/v1: bearer-token auth, rate limiting, error mapping, JSON helpers.

import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { UserError } from "@/lib/errors";
import { runAsUser } from "@/lib/actions/context";
import { Throttle } from "@/lib/mail/throttle";
import { hashToken, parseBearer } from "./tokens";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export interface ApiContext<P> { req: Request; params: P; url: URL; userId: string; tokenId: string; readOnly: boolean }

const MAX_BODY_BYTES = 1_000_000;
const perToken = new Throttle(120, 60_000);

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function errorResponse(status: number, code: string, message: string, headers: Record<string, string> = {}): Response {
  return json({ error: { code, message } }, status, headers);
}

/** A JSON object from the request body, or an ApiError explaining what is wrong. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new ApiError(413, "payload_too_large", "The request body is too large (1 MB limit).");
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new ApiError(400, "invalid_json", "The request body must be valid JSON."); }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new ApiError(400, "invalid_body", "The request body must be a JSON object.");
  return data as Record<string, unknown>;
}

/** Messages thrown by the action layer for things the caller did wrong, mapped to HTTP statuses. */
function fromError(error: unknown): Response {
  if (error instanceof ApiError) return errorResponse(error.status, error.code, error.message);
  if (error instanceof UserError) {
    const forbidden = /view-only|read-only|Only the project owner/i.test(error.message);
    return errorResponse(forbidden ? 403 : 400, forbidden ? "forbidden" : "invalid_request", error.message);
  }
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return errorResponse(401, "unauthorized", "Missing or invalid API token.");
    if (/not found/i.test(error.message) && !(error instanceof Prisma.PrismaClientKnownRequestError)) return errorResponse(404, "not_found", error.message);
    if (/view-only|Only the project owner/i.test(error.message)) return errorResponse(403, "forbidden", error.message);
    if (/decommissioned/i.test(error.message)) return errorResponse(409, "project_archived", error.message);
    const internal = error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientValidationError || error instanceof Prisma.PrismaClientUnknownRequestError;
    if (!internal && error.message.length < 200) return errorResponse(400, "invalid_request", error.message);
  }
  console.error("[api] unexpected error:", error);
  return errorResponse(500, "internal_error", "Something went wrong on our side.");
}

/** Wrap a handler: authenticates the token, applies the rate limit, and runs it as the token's owner. */
export function route<P = Record<string, string>>(handler: (ctx: ApiContext<P>) => Promise<Response | unknown>) {
  return async (req: Request, segment: { params: Promise<P> }): Promise<Response> => {
    const token = parseBearer(req.headers.get("authorization"));
    if (!token) return errorResponse(401, "unauthorized", "Send your API token as “Authorization: Bearer qp_…”.", { "WWW-Authenticate": 'Bearer realm="quick-planner"' });
    const row = await prisma.apiToken.findUnique({ where: { tokenHash: hashToken(token) }, select: { id: true, userId: true, readOnly: true, lastUsedAt: true } });
    if (!row) return errorResponse(401, "unauthorized", "Missing or invalid API token.", { "WWW-Authenticate": 'Bearer realm="quick-planner"' });
    if (!perToken.take(row.id)) return errorResponse(429, "rate_limited", "Too many requests: the limit is 120 per minute.", { "Retry-After": "30" });
    if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000) void prisma.apiToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

    const method = req.method.toUpperCase();
    if (row.readOnly && method !== "GET" && method !== "HEAD") return errorResponse(403, "forbidden", "This API token is read-only.");

    try {
      const params = await segment.params;
      const out = await runAsUser(row.userId, () => handler({ req, params, url: new URL(req.url), userId: row.userId, tokenId: row.id, readOnly: row.readOnly }), { readOnly: row.readOnly });
      return out instanceof Response ? out : json(out);
    } catch (error) {
      return fromError(error);
    }
  };
}

/** `?limit=` within bounds. */
export function limitParam(url: URL, def = 100, max = 500): number {
  const n = Number(url.searchParams.get("limit"));
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : def;
}
