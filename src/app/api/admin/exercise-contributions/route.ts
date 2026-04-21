import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

function isOwner(email: string) {
  return email === process.env.OWNER_EMAIL;
}

export async function GET() {
  const { email, res } = await requireSession();
  if (res) return res;
  if (!isOwner(email!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const exercises = await prisma.exercise.findMany({
    include: { contributions: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(exercises);
}

export async function PUT(req: Request) {
  const { email, res } = await requireSession();
  if (res) return res;
  if (!isOwner(email!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { exerciseId, contributions } = body as {
    exerciseId: string;
    contributions: { muscleGroup: string; weight: number }[];
  };

  if (!exerciseId || !Array.isArray(contributions)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const total = contributions.reduce((s, c) => s + c.weight, 0);
  if (Math.abs(total - 1) > 0.01) {
    return NextResponse.json({ error: "Weights must sum to 1.0" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.muscleContribution.deleteMany({ where: { exerciseId } }),
    prisma.muscleContribution.createMany({
      data: contributions.map((c) => ({
        exerciseId,
        muscleGroup: c.muscleGroup,
        weight: c.weight,
      })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
