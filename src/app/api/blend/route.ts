import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { blendDays, getBuiltInDay } from "@/lib/blend";
import { sequenceToToken, SEQUENCE_LENGTH } from "@/lib/blend-icons";
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

// 90 second window for the pairing handshake
const HANDSHAKE_TTL_MS = 90 * 1000;

export async function POST(req: NextRequest) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const session = await auth.api.getSession({ headers: await headers() });
  const myName = session?.user?.name ?? "Lifter";

  const body = await req.json().catch(() => ({}));
  const sequence: string[] = Array.isArray(body.sequence) ? body.sequence : [];
  const dayType: string | undefined = body.dayType;
  const day: DayDefinition | undefined = body.day;

  if (sequence.length !== SEQUENCE_LENGTH) {
    return NextResponse.json(
      { error: `Pick exactly ${SEQUENCE_LENGTH} icons` },
      { status: 400 }
    );
  }
  if (!dayType || !day) {
    return NextResponse.json({ error: "Missing day" }, { status: 400 });
  }

  const token = sequenceToToken(sequence);
  const allowSolo = process.env.ALLOW_BLEND_SOLO === "true";

  // Look for an existing pending invite with this token within the TTL
  const existing = await prisma.blendInvite.findUnique({ where: { token } });
  const now = new Date();

  if (existing) {
    const fresh = existing.expiresAt > now && existing.status === "pending";

    // User is the original host — just resume (handles page refresh)
    if (existing.hostId === userId && !allowSolo) {
      return NextResponse.json({ action: "resumed", token: existing.token });
    }

    // Someone else has already claimed this sequence & it's still fresh → join
    if (fresh && (existing.hostId !== userId || allowSolo)) {
      const hostDay = (existing.hostDay as DayDefinition | null) ??
        (existing.hostDayType ? getBuiltInDay(existing.hostDayType) : undefined);
      if (!hostDay) {
        return NextResponse.json({ error: "Host day missing" }, { status: 422 });
      }

      const guestKnownExercises = await fetchKnownExerciseIds(userId!);

      const blendedDay = blendDays(hostDay.exercises, day.exercises, {
        hostName: existing.hostName,
        guestName: myName,
        hostDayLabel: hostDay.label,
        guestDayLabel: day.label,
        hostKnownExercises: existing.hostKnownExercises,
        guestKnownExercises,
        shuffleSeed: 0,
      });

      await prisma.blendInvite.update({
        where: { token },
        data: {
          guestId: userId!,
          guestName: myName,
          guestDayType: dayType,
          guestDay: day as object,
          guestKnownExercises,
          blendedDay: blendedDay as object,
          status: "previewing",
          hostConfirmed: false,
          guestConfirmed: false,
          shuffleSeed: 0,
        },
      });

      return NextResponse.json({ action: "joined", token });
    }

    // Stale (expired or already active) — fall through to create a new invite
    // by overwriting it
    await prisma.blendInvite.delete({ where: { token } }).catch(() => {});
  }

  // Create as host — waits for a partner to submit the same sequence
  const hostKnownExercises = await fetchKnownExerciseIds(userId!);
  const expiresAt = new Date(now.getTime() + HANDSHAKE_TTL_MS);

  const invite = await prisma.blendInvite.create({
    data: {
      token,
      hostId: userId!,
      hostName: myName,
      hostDayType: dayType,
      hostDay: day as object,
      hostKnownExercises,
      expiresAt,
    },
  });

  return NextResponse.json({ action: "created", token: invite.token, expiresAt: invite.expiresAt });
}
