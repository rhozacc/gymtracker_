import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, res } = await requireSession();
  if (res) return res;

  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: {
      sets: true,
    },
  });

  const result = sessions.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    dayType: s.dayType,
    notes: s.notes,
    startedAt: s.startedAt?.toISOString() ?? null,
    endedAt: s.endedAt?.toISOString() ?? null,
    setCount: s.sets.filter((set) => !set.isWarmup).length,
    totalVolume: s.sets.filter((set) => !set.isWarmup).reduce((sum, set) => sum + set.reps * set.weight, 0),
    createdAt: s.createdAt.toISOString(),
  }));

  return NextResponse.json(result);
}

export async function DELETE() {
  const { userId, res } = await requireSession();
  if (res) return res;

  await prisma.session.deleteMany({ where: { userId } });
  return NextResponse.json({ deleted: true });
}

export async function POST(request: Request) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const body = await request.json();

  const session = await prisma.session.create({
    data: {
      userId,
      date: new Date(body.date),
      dayType: body.dayType,
      notes: body.notes || null,
      startedAt: body.startedAt ? new Date(body.startedAt) : null,
      endedAt: body.endedAt ? new Date(body.endedAt) : null,
      sets: {
        create: body.sets.map(
          (s: {
            exerciseId: string;
            setNumber: number;
            reps: number;
            weight: number;
            rir?: number;
            isWarmup?: boolean;
          }) => ({
            exerciseId: s.exerciseId,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            rir: s.rir ?? null,
            isWarmup: s.isWarmup ?? false,
          })
        ),
      },
    },
    include: { sets: true },
  });

  return NextResponse.json({ id: session.id }, { status: 201 });
}
