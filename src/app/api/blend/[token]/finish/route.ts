import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  const sessionId: string | undefined = body.sessionId;

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const invite = await prisma.blendInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isHost = invite.hostId === userId;
  const isGuest = invite.guestId === userId;
  if (!isHost && !isGuest) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify the session actually belongs to the caller
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: "Bad session" }, { status: 400 });
  }

  await prisma.blendInvite.update({
    where: { token },
    data: isHost ? { hostSessionId: sessionId } : { guestSessionId: sessionId },
  });

  return NextResponse.json({ ok: true });
}
