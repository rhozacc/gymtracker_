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

  if (!invite) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (invite.status === "pending" && new Date() > invite.expiresAt) {
    await prisma.blendInvite.update({ where: { token }, data: { status: "expired" } });
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }

  return NextResponse.json({
    status: invite.status,
    hostId: invite.hostId,
    hostName: invite.hostName,
    guestName: invite.guestName,
    hostDayType: invite.hostDayType,
    guestDayType: invite.guestDayType,
    hostDay: invite.hostDay,
    blendedDay: invite.blendedDay,
    hostConfirmed: invite.hostConfirmed,
    guestConfirmed: invite.guestConfirmed,
    shuffleSeed: invite.shuffleSeed,
    expiresAt: invite.expiresAt,
    isHost: invite.hostId === userId,
  });
}
