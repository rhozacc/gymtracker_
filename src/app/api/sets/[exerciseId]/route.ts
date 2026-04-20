import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { exerciseId: string } }
) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const lastSession = await prisma.session.findFirst({
    where: { userId, sets: { some: { exerciseId: params.exerciseId } } },
    orderBy: { date: "desc" },
    include: {
      sets: {
        where: { exerciseId: params.exerciseId, isWarmup: false },
        orderBy: { setNumber: "asc" },
      },
    },
  });

  return NextResponse.json(lastSession?.sets ?? []);
}
