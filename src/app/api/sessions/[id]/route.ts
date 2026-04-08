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
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.session.update({
    where: { id: params.id },
    data: {
      extras: body.extras ?? undefined,
    },
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
