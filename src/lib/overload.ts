import { Exercise } from "./program";

interface SetData {
  reps: number;
  weight: number;
}

export interface OverloadResult {
  ready: boolean;
  suggestedWeight: number;
  lastWeight: number;
  lastReps: number[];
}

export function checkOverload(
  exercise: Exercise,
  lastSets: SetData[]
): OverloadResult {
  if (lastSets.length === 0) {
    return { ready: false, suggestedWeight: 0, lastWeight: 0, lastReps: [] };
  }

  const lastWeight = Math.max(...lastSets.map((s) => s.weight));
  const lastReps = lastSets.map((s) => s.reps);
  const topOfRange = exercise.repRange[1];
  const allHitTop = lastSets.every((s) => s.reps >= topOfRange);

  return {
    ready: allHitTop,
    suggestedWeight: allHitTop ? lastWeight + exercise.increment : lastWeight,
    lastWeight,
    lastReps,
  };
}
