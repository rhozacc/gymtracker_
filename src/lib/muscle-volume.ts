import { MUSCLE_GROUPS, type MuscleGroup } from "./muscleGroups";

export type MuscleContributions = Record<
  string,
  { group: string; weight: number }[]
>;

interface SessionLike {
  date: string;
  sets: { exerciseId: string }[];
}

// Sum contribution-weighted sets per muscle group across sessions in
// the last `windowDays`. Returns total sets in the window — not weekly.
// Divide by `windowDays / 7` to get a weekly average.
export function computeMuscleVolume(
  sessions: SessionLike[],
  contributions: MuscleContributions,
  windowDays: number,
): Record<MuscleGroup, number> {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - windowDays);
  cutoff.setUTCHours(0, 0, 0, 0);

  const totals: Record<MuscleGroup, number> = {
    Chest: 0,
    Back: 0,
    Shoulders: 0,
    Legs: 0,
    Arms: 0,
  };

  for (const session of sessions) {
    if (new Date(session.date) < cutoff) continue;

    const setsByExercise: Record<string, number> = {};
    for (const s of session.sets) {
      setsByExercise[s.exerciseId] = (setsByExercise[s.exerciseId] || 0) + 1;
    }

    for (const exId of Object.keys(setsByExercise)) {
      const contribs = contributions[exId] ?? [];
      for (const { group, weight } of contribs) {
        if ((MUSCLE_GROUPS as readonly string[]).includes(group)) {
          totals[group as MuscleGroup] += setsByExercise[exId] * weight;
        }
      }
    }
  }

  return totals;
}
