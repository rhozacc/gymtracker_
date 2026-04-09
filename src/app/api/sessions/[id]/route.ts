import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      sets: {
        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
      },
      debrief: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...session,
    date: session.date.toISOString(),
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: { sets: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Update extras if provided
  const updateData: Record<string, unknown> = {};
  if (body.extras !== undefined) {
    updateData.extras = body.extras;
  }

  // Update sets if provided
  if (body.sets && Array.isArray(body.sets)) {
    updateData.editedAt = new Date();
    const incomingIds = new Set<string>();

    for (const s of body.sets) {
      if (s.id) {
        // Update existing set
        incomingIds.add(s.id);
        await prisma.set.update({
          where: { id: s.id },
          data: {
            exerciseId: s.exerciseId,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            rir: s.rir ?? null,
          },
        });
      } else {
        // Create new set
        const created = await prisma.set.create({
          data: {
            sessionId: params.id,
            exerciseId: s.exerciseId,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            rir: s.rir ?? null,
          },
        });
        incomingIds.add(created.id);
      }
    }

    // Delete sets that were removed
    const toDelete = session.sets.filter((s) => !incomingIds.has(s.id));
    if (toDelete.length > 0) {
      await prisma.set.deleteMany({
        where: { id: { in: toDelete.map((s) => s.id) } },
      });
    }
  }

  const updated = await prisma.session.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ id: updated.id });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await prisma.session.findUnique({
    where: { id: params.id },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.session.delete({ where: { id: params.id } });

  return NextResponse.json({ deleted: true });
}
