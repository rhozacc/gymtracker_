import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EXERCISE_ALIASES } from "@/lib/exerciseAliases";

export const revalidate = 3600;

export async function GET() {
  const rows = await prisma.muscleContribution.findMany();

  const byExercise: Record<string, { group: string; weight: number }[]> = {};
  for (const row of rows) {
    (byExercise[row.exerciseId] ??= []).push({
      group: row.muscleGroup,
      weight: row.weight,
    });
  }

  // Pre-expand aliases so the client does a plain lookup with no resolution logic
  const expanded = { ...byExercise };
  for (const [alias, canonical] of Object.entries(EXERCISE_ALIASES)) {
    if (byExercise[canonical]) expanded[alias] = byExercise[canonical];
  }

  return NextResponse.json(expanded);
}
