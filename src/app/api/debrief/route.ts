import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const debriefs = await prisma.debrief.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      session: {
        select: { date: true, dayType: true, startedAt: true, endedAt: true },
      },
    },
    take: 50,
  });

  return NextResponse.json(
    debriefs.map((d) => ({
      id: d.id,
      sessionId: d.sessionId,
      energy: d.energy,
      pump: d.pump,
      mood: d.mood,
      createdAt: d.createdAt.toISOString(),
      session: {
        date: d.session.date.toISOString(),
        dayType: d.session.dayType,
        startedAt: d.session.startedAt?.toISOString() ?? null,
        endedAt: d.session.endedAt?.toISOString() ?? null,
      },
    }))
  );
}

export async function POST(request: Request) {
  const body = await request.json();

  const debrief = await prisma.debrief.create({
    data: {
      sessionId: body.sessionId,
      energy: body.energy,
      pump: body.pump,
      mood: body.mood,
    },
  });

  return NextResponse.json({ id: debrief.id }, { status: 201 });
}
