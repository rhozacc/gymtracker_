import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_ID = "default";

export async function GET() {
  try {
    const config = await prisma.extrasConfig.findUnique({
      where: { id: DEFAULT_ID },
    });
    return NextResponse.json(config ?? { abs: null, cardio: null, stretch: null });
  } catch {
    // Table may not exist yet — return defaults
    return NextResponse.json({ abs: null, cardio: null, stretch: null });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { abs, cardio, stretch } = body;

    const config = await prisma.extrasConfig.upsert({
      where: { id: DEFAULT_ID },
      update: { abs: abs ?? null, cardio: cardio ?? null, stretch: stretch ?? null },
      create: { id: DEFAULT_ID, abs: abs ?? null, cardio: cardio ?? null, stretch: stretch ?? null },
    });

    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "Failed to save extras" }, { status: 500 });
  }
}
