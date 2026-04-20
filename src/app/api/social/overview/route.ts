import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const { res } = await requireSession();
  if (res) return res;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  weekStart.setUTCHours(0, 0, 0, 0);

  const cutoff90 = new Date(now);
  cutoff90.setDate(cutoff90.getDate() - 90);

  const [totalUsers, activeSessionsThisWeek, totalVolRaw, recentSessions] =
    await Promise.all([
      prisma.user.count(),
      prisma.session.findMany({
        where: { date: { gte: weekStart } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.$queryRaw<[{ total: number | null }]>(
        Prisma.sql`SELECT SUM(reps::float8 * weight) AS total FROM "Set" WHERE "isWarmup" = false`
      ),
      prisma.session.findMany({
        where: { date: { gte: cutoff90 } },
        include: { sets: true },
        orderBy: { date: "asc" },
      }),
    ]);

  // Build per-day combined volume for heatmap
  const dayMap = new Map<string, number>();
  for (const session of recentSessions) {
    const key = new Date(session.date).toISOString().split("T")[0];
    const vol = session.sets.filter((s) => !s.isWarmup).reduce((sum, s) => sum + s.reps * s.weight, 0);
    dayMap.set(key, (dayMap.get(key) ?? 0) + vol);
  }

  const activity = Array.from(dayMap.entries()).map(([date, volume]) => ({
    date,
    volume,
  }));

  return NextResponse.json({
    totalUsers,
    activeThisWeek: activeSessionsThisWeek.length,
    totalVolumeKg: Number(totalVolRaw[0]?.total ?? 0),
    activity,
  });
}
