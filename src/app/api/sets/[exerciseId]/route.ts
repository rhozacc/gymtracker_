import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { exerciseId: string } }
) {
  const lastSession = await prisma.session.findFirst({
    where: { sets: { some: { exerciseId: params.exerciseId } } },
    orderBy: { date: "desc" },
    include: {
      sets: {
        where: { exerciseId: params.exerciseId },
        orderBy: { setNumber: "asc" },
      },
    },
  });

  return NextResponse.json(lastSession?.sets ?? []);
}
