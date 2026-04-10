import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, res } = await requireSession();
  if (res) return res;

  const sessions = await prisma.session.findMany({
    where: { userId },
    include: {
      sets: { orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }] },
      debrief: true,
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  sessions.reverse();

  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      date: s.date.toISOString(),
      dayType: s.dayType,
      startedAt: s.startedAt?.toISOString() ?? null,
      endedAt: s.endedAt?.toISOString() ?? null,
      sets: s.sets.map((set) => ({
        exerciseId: set.exerciseId,
        setNumber: set.setNumber,
        reps: set.reps,
        weight: set.weight,
        rir: set.rir,
      })),
      debrief: s.debrief
        ? { energy: s.debrief.energy, pump: s.debrief.pump, mood: s.debrief.mood }
        : null,
    }))
  );
}
