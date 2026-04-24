import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { blendDays } from "@/lib/blend";
import type { DayDefinition } from "@/lib/program";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const { token } = await params;
  const invite = await prisma.blendInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invite.status !== "previewing") {
    return NextResponse.json({ error: "Can only shuffle during preview" }, { status: 409 });
  }
  if (invite.hostId !== userId && invite.guestId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hostDay = invite.hostDay as DayDefinition | null;
  const guestDay = invite.guestDay as DayDefinition | null;
  if (!hostDay || !guestDay) {
    return NextResponse.json({ error: "Missing day data" }, { status: 422 });
  }

  const newSeed = Date.now() & 0xffffffff;
  const blendedDay = blendDays(hostDay.exercises, guestDay.exercises, {
    hostName: invite.hostName,
    guestName: invite.guestName ?? "Guest",
    hostDayLabel: hostDay.label,
    guestDayLabel: guestDay.label,
    hostKnownExercises: invite.hostKnownExercises,
    guestKnownExercises: invite.guestKnownExercises,
    shuffleSeed: newSeed,
  });

  await prisma.blendInvite.update({
    where: { token },
    data: {
      blendedDay: blendedDay as object,
      shuffleSeed: newSeed,
      hostConfirmed: false,
      guestConfirmed: false,
    },
  });

  return NextResponse.json({ blendedDay });
}
