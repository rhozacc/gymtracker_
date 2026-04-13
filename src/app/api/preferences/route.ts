import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const { userId, res } = await requireSession();
  if (res) return res;

  try {
    // First try by userId (correct path for established users)
    let prefs = await prisma.userPreferences.findFirst({ where: { userId } });
    if (!prefs) {
      // Fallback: upsert the single "default" record (handles legacy userId=null
      // records created before multi-user auth, and new users with no record yet)
      prefs = await prisma.userPreferences.upsert({
        where: { id: "default" },
        update: { userId },
        create: { userId },
      });
    }
    return NextResponse.json(prefs);
  } catch {
    return NextResponse.json({
      onboarded: false,
      activePlan: "upper_lower",
      theme: "dark",
      unit: "kg",
    });
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

    // Upsert by the fixed "default" id — works for legacy records (userId=null)
    // and for users whose record hasn't been created yet
    const prefs = await prisma.userPreferences.upsert({
      where: { id: "default" },
      update: { userId, ...data },
      create: { userId, ...data },
    });

    return NextResponse.json(prefs);
  } catch {
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
