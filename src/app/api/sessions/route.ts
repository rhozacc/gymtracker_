import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: "desc" },
    include: {
      sets: true,
      _count: { select: { sets: true } },
    },
  });

  const result = sessions.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    dayType: s.dayType,
    notes: s.notes,
    startedAt: s.startedAt?.toISOString() ?? null,
    endedAt: s.endedAt?.toISOString() ?? null,
    setCount: s._count.sets,
    totalVolume: s.sets.reduce((sum, set) => sum + set.reps * set.weight, 0),
    createdAt: s.createdAt.toISOString(),
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();

  const session = await prisma.session.create({
    data: {
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
          }) => ({
            exerciseId: s.exerciseId,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            rir: s.rir ?? null,
          })
        ),
      },
    },
    include: { sets: true },
  });

  return NextResponse.json({ id: session.id }, { status: 201 });
}
