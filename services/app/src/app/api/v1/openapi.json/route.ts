import { appBaseUrl } from "@/lib/mail/config";
import { openApiDocument } from "@/lib/api/openapi";

export const dynamic = "force-dynamic";

/** The API description. Public: it contains no data, only how to ask for it. */
export async function GET() {
  return Response.json(openApiDocument(appBaseUrl()), { headers: { "Cache-Control": "public, max-age=300" } });
}
