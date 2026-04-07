import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const weeks = 16;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);

  const sessions = await prisma.session.findMany({
    where: { date: { gte: cutoff } },
    include: { sets: true },
    orderBy: { date: "asc" },
  });

  const weeklyData = new Map<string, Record<string, number>>();

  for (const session of sessions) {
    const d = new Date(session.date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d);
    weekStart.setUTCDate(diff);
    weekStart.setUTCHours(0, 0, 0, 0);
    const key = weekStart.toISOString().split("T")[0];

    if (!weeklyData.has(key)) {
      weeklyData.set(key, {});
    }

    const vol = session.sets.reduce(
      (sum, s) => sum + s.reps * s.weight,
      0
    );
    const entry = weeklyData.get(key)!;
    entry[session.dayType] = (entry[session.dayType] || 0) + vol;
  }

  const result = Array.from(weeklyData.entries())
    .map(([week, data]) => ({
      week,
      ...data,
      total: Object.values(data).reduce((sum, v) => sum + v, 0),
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  return NextResponse.json(result);
}
