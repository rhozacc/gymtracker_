import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { res } = await requireSession();
  if (res) return res;

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const sessions = await prisma.session.findMany({
    where: { startedAt: { not: null, gte: cutoff } },
    include: { sets: true },
  });

  const hourlyMap = new Map<number, number>();
  for (const session of sessions) {
    const hour = new Date(session.startedAt!).getUTCHours();
    const vol = session.sets.filter((s) => !s.isWarmup).reduce((sum, s) => sum + s.reps * s.weight, 0);
    hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + vol);
  }

  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    volume: hourlyMap.get(h) ?? 0,
  }));

  return NextResponse.json({ hourly });
}
