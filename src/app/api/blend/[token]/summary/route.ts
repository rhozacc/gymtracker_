import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import type { BlendedDayDefinition } from "@/lib/blend";

interface PerExerciseStats {
  sets: number;
  totalReps: number;
  volumeKg: number;
  topWeightKg: number;
}

interface PerUserTotals {
  sets: number;
  totalReps: number;
  volumeKg: number;
  durationMin: number | null;
}

function emptyStats(): PerExerciseStats {
  return { sets: 0, totalReps: 0, volumeKg: 0, topWeightKg: 0 };
}

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
  const isGuest = invite.guestId === userId;
  if (!isHost && !isGuest) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const blendedDay = invite.blendedDay as BlendedDayDefinition | null;
  if (!blendedDay) {
    return NextResponse.json({ error: "No blend computed" }, { status: 422 });
  }

  // Build name lookup so unknown exercises (added during the session) still
  // get a label
  const nameByExerciseId: Record<string, string> = {};
  for (const ex of blendedDay.exercises) {
    nameByExerciseId[ex.id] = ex.name;
  }

  // Pull both saved sessions if they exist (with their sets)
  const [hostSession, guestSession] = await Promise.all([
    invite.hostSessionId
      ? prisma.session.findUnique({
          where: { id: invite.hostSessionId },
          include: { sets: true },
        })
      : Promise.resolve(null),
    invite.guestSessionId
      ? prisma.session.findUnique({
          where: { id: invite.guestSessionId },
          include: { sets: true },
        })
      : Promise.resolve(null),
  ]);

  // Aggregate per-exercise stats from a session's sets (working sets only).
  // Also accumulates user totals.
  function aggregate(
    session: { sets: { exerciseId: string; reps: number; weight: number; isWarmup: boolean }[]; startedAt: Date | null; endedAt: Date | null } | null
  ): { perExercise: Record<string, PerExerciseStats>; totals: PerUserTotals } {
    const perExercise: Record<string, PerExerciseStats> = {};
    let sets = 0;
    let totalReps = 0;
    let volumeKg = 0;
    if (!session) return { perExercise, totals: { sets: 0, totalReps: 0, volumeKg: 0, durationMin: null } };

    for (const s of session.sets) {
      if (s.isWarmup) continue;
      const slot = perExercise[s.exerciseId] ?? emptyStats();
      slot.sets += 1;
      slot.totalReps += s.reps;
      slot.volumeKg += s.reps * s.weight;
      if (s.weight > slot.topWeightKg) slot.topWeightKg = s.weight;
      perExercise[s.exerciseId] = slot;
      sets += 1;
      totalReps += s.reps;
      volumeKg += s.reps * s.weight;
      if (!nameByExerciseId[s.exerciseId]) nameByExerciseId[s.exerciseId] = s.exerciseId;
    }

    const durationMin =
      session.startedAt && session.endedAt
        ? Math.max(0, Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000))
        : null;

    return { perExercise, totals: { sets, totalReps, volumeKg, durationMin } };
  }

  const hostAgg = aggregate(hostSession);
  const guestAgg = aggregate(guestSession);

  // Per-exercise comparison rows, ordered by the blended day so the UI matches
  const exerciseIdsInOrder: string[] = [];
  const seen = new Set<string>();
  for (const ex of blendedDay.exercises) {
    if (!seen.has(ex.id)) {
      exerciseIdsInOrder.push(ex.id);
      seen.add(ex.id);
    }
  }
  // Tail any extras the users added that weren't in the original blended day
  for (const id of Object.keys({ ...hostAgg.perExercise, ...guestAgg.perExercise })) {
    if (!seen.has(id)) {
      exerciseIdsInOrder.push(id);
      seen.add(id);
    }
  }

  const exercises = exerciseIdsInOrder.map((id) => ({
    id,
    name: nameByExerciseId[id] ?? id,
    host: hostAgg.perExercise[id] ?? emptyStats(),
    guest: guestAgg.perExercise[id] ?? emptyStats(),
  }));

  return NextResponse.json({
    hostName: invite.hostName,
    guestName: invite.guestName,
    isHost,
    hostFinished: !!invite.hostSessionId,
    guestFinished: !!invite.guestSessionId,
    blendedDayLabel: blendedDay.label,
    exercises,
    totals: {
      host: hostAgg.totals,
      guest: guestAgg.totals,
    },
  });
}
