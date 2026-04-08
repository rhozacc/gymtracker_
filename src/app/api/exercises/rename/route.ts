import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Rename an exercise within a plan.
 *
 * Body:
 *   planSlug: string        — which plan to modify
 *   dayKey: string          — which day within the plan
 *   exerciseId: string      — current exercise ID
 *   newName: string         — the new display name
 *   mode: "rename" | "new"  — rename keeps the same ID (history follows);
 *                              new creates a fresh ID (history stays under old name)
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { planSlug, dayKey, exerciseId, newName, mode } = body;

  if (!planSlug || !dayKey || !exerciseId || !newName || !mode) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const days = plan.days as Record<string, { label: string; exercises: Array<{ id: string; name: string; [k: string]: unknown }> }>;
  const day = days[dayKey];
  if (!day) {
    return NextResponse.json({ error: "Day not found" }, { status: 404 });
  }

  const exIdx = day.exercises.findIndex((e) => e.id === exerciseId);
  if (exIdx === -1) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  if (mode === "rename") {
    // Keep same ID, just update the display name — history automatically follows
    day.exercises[exIdx] = { ...day.exercises[exIdx], name: newName };
  } else if (mode === "new") {
    // Create new exercise with fresh ID, old history stays under old ID
    const slug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    const newId = `${dayKey}_${slug}`;
    day.exercises[exIdx] = { ...day.exercises[exIdx], id: newId, name: newName };
  } else {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  days[dayKey] = day;

  const updated = await prisma.plan.update({
    where: { slug: planSlug },
    data: { days: days as object },
  });

  return NextResponse.json(updated);
}
