import prisma from "@/lib/db";
import { getProjectAccess } from "@/lib/actions/helpers";
import { getHub, type RealtimeEvent } from "@/lib/realtime/hub";

// A long-lived response: never cache, never render statically, and keep it on the Node runtime.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// A real event (not an SSE comment) so the browser-side watchdog can see that the stream is alive.
const HEARTBEAT_MS = 15_000;

/**
 * Server-sent events for one project: presence snapshots and "something changed" notifications.
 * Anyone who can open the project (owner, editor, viewer) may listen; nobody else can.
 */
export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const access = await getProjectAccess(projectId);
  if (!access) return new Response("Not found", { status: 404 });

  const person = await prisma.user.findUnique({ where: { id: access.userId }, select: { name: true, email: true, image: true } });
  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const write = (chunk: string) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(chunk)); } catch { closed = true; }
      };
      const send = (event: RealtimeEvent) => write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);

      const connection = getHub().connect(
        projectId,
        { id: access.userId, name: person?.name || person?.email || null, image: person?.image ?? null },
        send,
        () => { try { controller.close(); } catch { /* already closed */ } closed = true; }
      );
      if (!connection) {
        write(`event: limit\ndata: ${JSON.stringify({ message: "Too many open connections" })}\n\n`);
        controller.close();
        return;
      }

      // The client needs its own connection id to report presence for this stream.
      write(`event: hello\ndata: ${JSON.stringify({ clientId: connection.clientId, userId: access.userId, role: access.role })}\n\n`);
      write(`retry: 3000\n\n`);

      const heartbeat = setInterval(() => write(`event: ping\ndata: {}\n\n`), HEARTBEAT_MS);
      cleanup = () => {
        clearInterval(heartbeat);
        closed = true;
        connection.disconnect();
      };
      req.signal.addEventListener("abort", () => cleanup());
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // tell nginx-style proxies not to buffer the stream
    },
  });
}
