import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const { userId, res } = await requireSession();
  if (res) return res;

  try {
    const config = await prisma.extrasConfig.findFirst({ where: { userId } });
    return NextResponse.json(config ?? { abs: null, cardio: null, stretch: null });
  } catch {
    return NextResponse.json({ abs: null, cardio: null, stretch: null });
  }
}

export async function PUT(req: Request) {
  const { userId, res } = await requireSession();
  if (res) return res;

  try {
    const body = await req.json();
    const { abs, cardio, stretch } = body;

    const existing = await prisma.extrasConfig.findFirst({ where: { userId } });
    const config = existing
      ? await prisma.extrasConfig.update({
          where: { id: existing.id },
          data: { abs: abs ?? null, cardio: cardio ?? null, stretch: stretch ?? null },
        })
      : await prisma.extrasConfig.create({
          data: { userId, abs: abs ?? null, cardio: cardio ?? null, stretch: stretch ?? null },
        });

    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Failed to save extras" }, { status: 500 });
  }
}
