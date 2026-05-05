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

    const data = { abs: abs ?? null, cardio: cardio ?? null, stretch: stretch ?? null };
    const config = await prisma.extrasConfig.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Failed to save extras" }, { status: 500 });
  }
}
