import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const session = await prisma.session.findUnique({
    where: { id: params.id, userId },
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
  const { userId, res } = await requireSession();
  if (res) return res;

  const body = await request.json();

  const session = await prisma.session.findUnique({
    where: { id: params.id, userId },
    include: { sets: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.extras !== undefined) {
    updateData.extras = body.extras;
  }

  if (body.sets && Array.isArray(body.sets)) {
    updateData.editedAt = new Date();
    const existingSetIds = new Set(session.sets.map((s) => s.id));
    const incomingIds = new Set<string>();

    const ops: Prisma.PrismaPromise<unknown>[] = [];
    for (const s of body.sets) {
      if (s.id) {
        // Only allow updates to sets that belong to this session.
        // Prevents a user from PATCHing their own session with another user's set ID.
        if (!existingSetIds.has(s.id)) {
          return NextResponse.json({ error: "Invalid set id" }, { status: 400 });
        }
        incomingIds.add(s.id);
        ops.push(
          prisma.set.update({
            where: { id: s.id },
            data: {
              exerciseId: s.exerciseId,
              setNumber: s.setNumber,
              reps: s.reps,
              weight: s.weight,
              rir: s.rir ?? null,
            },
          })
        );
      } else {
        ops.push(
          prisma.set.create({
            data: {
              sessionId: params.id,
              exerciseId: s.exerciseId,
              setNumber: s.setNumber,
              reps: s.reps,
              weight: s.weight,
              rir: s.rir ?? null,
            },
          })
        );
      }
    }

    const toDelete = session.sets.filter((s) => !incomingIds.has(s.id));
    if (toDelete.length > 0) {
      ops.push(
        prisma.set.deleteMany({
          where: { id: { in: toDelete.map((s) => s.id) }, sessionId: params.id },
        })
      );
    }

    ops.push(prisma.session.update({ where: { id: params.id }, data: updateData }));
    await prisma.$transaction(ops);
    return NextResponse.json({ id: params.id });
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
  const { userId, res } = await requireSession();
  if (res) return res;

  const session = await prisma.session.findUnique({
    where: { id: params.id, userId },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.session.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
