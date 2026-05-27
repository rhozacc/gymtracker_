import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// How long a single stream lives before closing so the platform never kills it
// mid-write; the browser's EventSource auto-reconnects after this.
const STREAM_LIFETIME_MS = 50_000;
const POLL_INTERVAL_MS = 3_000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const { token } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let lastPayload = "";
      let interval: ReturnType<typeof setInterval>;
      let lifetime: ReturnType<typeof setTimeout>;

      const send = (data: string) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };
      const heartbeat = () => {
        if (closed) return;
        controller.enqueue(encoder.encode(`: ping\n\n`));
      };

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        clearTimeout(lifetime);
        try {
          controller.close();
        } catch { /* already closed */ }
      };

      const tick = async () => {
        if (closed) return;
        try {
          const invite = await prisma.blendInvite.findUnique({ where: { token } });
          if (!invite) {
            send(JSON.stringify({ error: "not_found" }));
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            close();
            return;
          }

          const isHost = invite.hostId === userId;
          const payload = {
            partner: isHost ? invite.guestProgress : invite.hostProgress,
            partnerName: isHost ? invite.guestName : invite.hostName,
            status: invite.status,
          };
          const serialized = JSON.stringify(payload);
          if (serialized !== lastPayload) {
            lastPayload = serialized;
            send(serialized);
          } else {
            heartbeat();
          }

          if (invite.status !== "active") {
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            close();
          }
        } catch {
          // Transient DB error — keep the connection, retry next tick.
          heartbeat();
        }
      };

      interval = setInterval(tick, POLL_INTERVAL_MS);
      lifetime = setTimeout(close, STREAM_LIFETIME_MS);
      req.signal.addEventListener("abort", () => {
        clearTimeout(lifetime);
        close();
      });

      // Initial push so the client renders immediately on connect.
      await tick();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
