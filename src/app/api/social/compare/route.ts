import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export async function GET() {
  const { userId, res } = await requireSession();
  if (res) return res;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 8 * 7);
  cutoff.setUTCHours(0, 0, 0, 0);

  const sessions = await prisma.session.findMany({
    where: { date: { gte: cutoff } },
    select: {
      userId: true,
      date: true,
      sets: { select: { reps: true, weight: true, isWarmup: true } },
    },
    orderBy: { date: "asc" },
  });

  // week -> userId -> total volume
  const weekUserVol = new Map<string, Map<string, number>>();

  for (const session of sessions) {
    const week = getWeekKey(session.date);
    const vol = session.sets.filter((s) => !s.isWarmup).reduce((sum, s) => sum + s.reps * s.weight, 0);
    const uid = session.userId ?? "anon";
    if (!weekUserVol.has(week)) weekUserVol.set(week, new Map());
    const userMap = weekUserVol.get(week)!;
    userMap.set(uid, (userMap.get(uid) ?? 0) + vol);
  }

  const weeks = Array.from(weekUserVol.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, userMap]) => {
      const allVols = Array.from(userMap.values());
      const avg =
        allVols.length > 0
          ? allVols.reduce((s, v) => s + v, 0) / allVols.length
          : 0;
      const mine = userMap.get(userId) ?? 0;
      return { week, mine, avg: Math.round(avg) };
    });

  // Percentile within the current week
  const currentWeek = getWeekKey(new Date());
  const currentMap = weekUserVol.get(currentWeek);
  let percentile = 50;
  if (currentMap && currentMap.size > 1) {
    const myVol = currentMap.get(userId) ?? 0;
    const allVols = Array.from(currentMap.values()).sort((a, b) => a - b);
    const below = allVols.filter((v) => v < myVol).length;
    percentile = Math.round((below / allVols.length) * 100);
  }

  return NextResponse.json({ weeks, percentile });
}
