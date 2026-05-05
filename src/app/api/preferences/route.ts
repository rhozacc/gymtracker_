import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const { userId, res } = await requireSession();
  if (res) return res;

  try {
    const prefs = await prisma.userPreferences.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return NextResponse.json(prefs);
  } catch {
    return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { userId, res } = await requireSession();
  if (res) return res;

  try {
    const body = await req.json();
    const { onboarded, activePlan, theme, unit, dayOrder, onboardingStep } = body;

    const data: Record<string, unknown> = {};
    if (onboarded !== undefined) data.onboarded = onboarded;
    if (activePlan !== undefined) data.activePlan = activePlan;
    if (theme !== undefined) data.theme = theme;
    if (unit !== undefined) data.unit = unit;
    if (dayOrder !== undefined) data.dayOrder = dayOrder;
    if (onboardingStep !== undefined) data.onboardingStep = onboardingStep;

    const prefs = await prisma.userPreferences.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return NextResponse.json(prefs);
  } catch {
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
