import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, res } = await requireSession();
  if (res) return res;

  const debriefs = await prisma.debrief.findMany({
    where: { session: { userId } },
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
  const { userId, res } = await requireSession();
  if (res) return res;

  const body = await request.json();

  // Verify the session belongs to this user
  const session = await prisma.session.findUnique({
    where: { id: body.sessionId, userId },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

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
