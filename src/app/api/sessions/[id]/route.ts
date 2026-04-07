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
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...session,
    date: session.date.toISOString(),
    createdAt: session.createdAt.toISOString(),
  });
}
