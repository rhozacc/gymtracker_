import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const { token } = await params;
  const invite = await prisma.blendInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isHost = invite.hostId === userId;
  return NextResponse.json({
    mine: isHost ? invite.hostProgress : invite.guestProgress,
    partner: isHost ? invite.guestProgress : invite.hostProgress,
    partnerName: isHost ? invite.guestName : invite.hostName,
    status: invite.status,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  const { exerciseIndex, setIndex } = body as {
    exerciseIndex: number;
    setIndex: number;
  };

  const invite = await prisma.blendInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isHost = invite.hostId === userId;
  const field = isHost ? "hostProgress" : "guestProgress";

  await prisma.blendInvite.update({
    where: { token },
    data: { [field]: { exerciseIndex, setIndex } },
  });

  return NextResponse.json({ ok: true });
}
