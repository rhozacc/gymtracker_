import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const { token } = await params;
  const invite = await prisma.blendInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invite.status !== "previewing" && invite.status !== "active") {
    return NextResponse.json({ error: "Invalid state" }, { status: 409 });
  }

  const isHost = invite.hostId === userId;
  const isGuest = invite.guestId === userId;
  if (!isHost && !isGuest) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: {
    hostConfirmed?: boolean;
    guestConfirmed?: boolean;
    status?: string;
  } = isHost ? { hostConfirmed: true } : { guestConfirmed: true };

  const nextHostConf = isHost ? true : invite.hostConfirmed;
  const nextGuestConf = isGuest ? true : invite.guestConfirmed;
  if (nextHostConf && nextGuestConf) {
    data.status = "active";
  }

  const updated = await prisma.blendInvite.update({
    where: { token },
    data,
  });

  return NextResponse.json({
    hostConfirmed: updated.hostConfirmed,
    guestConfirmed: updated.guestConfirmed,
    status: updated.status,
  });
}
