import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { res } = await requireSession();
  if (res) return res;

  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  weekStart.setUTCHours(0, 0, 0, 0);

  const [rawActive, topExercisesRaw] = await Promise.all([
    prisma.session.findMany({
      where: {
        startedAt: { not: null, gte: threeHoursAgo },
        endedAt: null,
      },
      select: { startedAt: true },
      orderBy: { startedAt: "asc" },
    }),
    prisma.set.groupBy({
      by: ["exerciseId"],
      where: { session: { date: { gte: weekStart } } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
  ]);

  const now = Date.now();
  const sessions = rawActive.map((s) => ({
    startedAt: s.startedAt!.toISOString(),
    durationMin: Math.floor(
      (now - new Date(s.startedAt!).getTime()) / 60000
    ),
  }));

  const topExercises = topExercisesRaw.map((e) => ({
    exerciseId: e.exerciseId,
    setCount: e._count.id,
  }));

  return NextResponse.json({
    count: sessions.length,
    sessions,
    topExercises,
  });
}
