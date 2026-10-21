import { NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/actions/helpers";
import { getHub } from "@/lib/realtime/hub";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ID_PATTERN = /^[\w-]{1,64}$/;
const PAGES = new Set(["board", "backlog", "timeline", "sprints", "members", "nodes", "history"]);

/** A client reports where it is and what it has open. Only the connection's own user may update it. */
export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const access = await getProjectAccess(projectId);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { clientId?: unknown; page?: unknown; viewing?: unknown; editing?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (typeof body.clientId !== "string" || !ID_PATTERN.test(body.clientId)) return NextResponse.json({ error: "Invalid client" }, { status: 400 });

  const id = (value: unknown) => (typeof value === "string" && ID_PATTERN.test(value) ? value : value === null ? null : undefined);
  const page = typeof body.page === "string" && PAGES.has(body.page) ? body.page : body.page === null ? null : undefined;

  const ok = getHub().updatePresence(body.clientId, access.userId, { page, viewing: id(body.viewing), editing: id(body.editing) });
  return NextResponse.json({ ok }, { status: ok ? 200 : 410 });
}
