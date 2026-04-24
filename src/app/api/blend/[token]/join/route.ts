import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { blendDays, getBuiltInDay } from "@/lib/blend";
import type { DayDefinition } from "@/lib/program";

async function fetchKnownExerciseIds(userId: string): Promise<string[]> {
  const rows = await prisma.set.findMany({
    where: { session: { userId } },
    select: { exerciseId: true },
    distinct: ["exerciseId"],
    take: 500,
  });
  return rows.map((r) => r.exerciseId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  const guestDayType: string = body.dayType;
  const guestDay: DayDefinition | undefined = body.day;

  const session = await auth.api.getSession({ headers: await headers() });
  const guestName = session?.user?.name ?? "Guest";

  const invite = await prisma.blendInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invite.status !== "pending") {
    return NextResponse.json({ error: "Already joined or expired" }, { status: 409 });
  }
  if (new Date() > invite.expiresAt) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }
  if (invite.hostId === userId) {
    return NextResponse.json({ error: "Cannot join your own session" }, { status: 400 });
  }

  const hostDay: DayDefinition | undefined =
    (invite.hostDay as DayDefinition | null) ??
    (invite.hostDayType ? getBuiltInDay(invite.hostDayType) : undefined);

  if (!hostDay) {
    return NextResponse.json({ error: "Host day not found" }, { status: 422 });
  }

  const resolvedGuestDay: DayDefinition | undefined =
    guestDay ?? (guestDayType ? getBuiltInDay(guestDayType) : undefined);

  if (!resolvedGuestDay) {
    return NextResponse.json({ error: "Guest day not found" }, { status: 422 });
  }

  const guestKnownExercises = await fetchKnownExerciseIds(userId!);

  const blendedDay = blendDays(hostDay.exercises, resolvedGuestDay.exercises, {
    hostName: invite.hostName,
    guestName,
    hostDayLabel: hostDay.label,
    guestDayLabel: resolvedGuestDay.label,
    hostKnownExercises: invite.hostKnownExercises,
    guestKnownExercises,
    shuffleSeed: 0,
  });

  await prisma.blendInvite.update({
    where: { token },
    data: {
      guestId: userId!,
      guestName,
      guestDayType: guestDayType ?? null,
      guestDay: resolvedGuestDay as object,
      guestKnownExercises,
      blendedDay: blendedDay as object,
      status: "previewing",
      hostConfirmed: false,
      guestConfirmed: false,
      shuffleSeed: 0,
    },
  });

  return NextResponse.json({ blendedDay });
}
