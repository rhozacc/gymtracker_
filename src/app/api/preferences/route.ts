import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const { userId, res } = await requireSession();
  if (res) return res;

  try {
    let prefs = await prisma.userPreferences.findFirst({
      where: { userId },
    });
    if (!prefs) {
      prefs = await prisma.userPreferences.create({
        data: { userId },
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
    const { onboarded, activePlan, theme, unit, dayOrder } = body;

    const data: Record<string, unknown> = {};
    if (onboarded !== undefined) data.onboarded = onboarded;
    if (activePlan !== undefined) data.activePlan = activePlan;
    if (theme !== undefined) data.theme = theme;
    if (unit !== undefined) data.unit = unit;
    if (dayOrder !== undefined) data.dayOrder = dayOrder;

    const existing = await prisma.userPreferences.findFirst({ where: { userId } });
    const prefs = existing
      ? await prisma.userPreferences.update({ where: { id: existing.id }, data })
      : await prisma.userPreferences.create({ data: { userId, ...data } });

    return NextResponse.json(prefs);
  } catch {
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
