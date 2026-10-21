import { getProjectAccess } from "@/lib/actions/helpers";
import { buildOwnExport } from "@/lib/actions/exportCore";
import { exportToCsv, exportToJson } from "@/lib/importer/export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Download a project as JSON (everything, re-importable) or CSV (the items, for spreadsheets). Any member may export. */
export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const access = await getProjectAccess(projectId);
  if (!access) return new Response("Not found", { status: 404 });

  const data = await buildOwnExport(projectId);
  if (!data) return new Response("Not found", { status: 404 });

  const format = new URL(req.url).searchParams.get("format") === "csv" ? "csv" : "json";
  const base = (data.project?.name ?? "project").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";
  const stamp = new Date().toISOString().slice(0, 10);
  const body = format === "csv" ? exportToCsv(data) : exportToJson(data);
  return new Response(body, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}-${stamp}.${format}"`,
      "Cache-Control": "no-store",
    },
  });
}
