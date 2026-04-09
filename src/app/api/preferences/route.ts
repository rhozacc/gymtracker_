import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_ID = "default";

export async function GET() {
  try {
    let prefs = await prisma.userPreferences.findUnique({
      where: { id: DEFAULT_ID },
    });
    if (!prefs) {
      prefs = await prisma.userPreferences.create({
        data: { id: DEFAULT_ID },
      });
    }
    return NextResponse.json(prefs);
  } catch {
    return NextResponse.json({
      id: DEFAULT_ID,
      onboarded: false,
      activePlan: "upper_lower",
      theme: "dark",
      unit: "kg",
    });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { onboarded, activePlan, theme, unit } = body;

    const data: Record<string, unknown> = {};
    if (onboarded !== undefined) data.onboarded = onboarded;
    if (activePlan !== undefined) data.activePlan = activePlan;
    if (theme !== undefined) data.theme = theme;
    if (unit !== undefined) data.unit = unit;

    const prefs = await prisma.userPreferences.upsert({
      where: { id: DEFAULT_ID },
      update: data,
      create: { id: DEFAULT_ID, ...data },
    });

    return NextResponse.json(prefs);
  } catch {
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
