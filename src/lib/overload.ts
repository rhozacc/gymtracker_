import { Exercise } from "./program";

interface SetData {
  reps: number;
  weight: number;
  rir?: number | null;
}

export type OverloadStatus = "go_up" | "almost_ready" | "none";

export interface OverloadResult {
  ready: boolean;
  status: OverloadStatus;
  suggestedWeight: number;
  lastWeight: number;
  lastWeights: number[];
  lastReps: number[];
}

export function checkOverload(
  exercise: Exercise,
  lastSets: SetData[]
): OverloadResult {
  if (lastSets.length === 0) {
    return { ready: false, status: "none", suggestedWeight: 0, lastWeight: 0, lastWeights: [], lastReps: [] };
  }

  const lastWeights = lastSets.map((s) => s.weight);
  const lastReps = lastSets.map((s) => s.reps);
  const [bottomOfRange, topOfRange] = exercise.repRange;

  // Find the effective set: highest weight where reps stayed within the rep range minimum.
  // This prevents a failed heavy attempt from inflating the suggestion.
  const setsInRange = lastSets.filter((s) => s.reps >= bottomOfRange);
  const pool = setsInRange.length > 0 ? setsInRange : lastSets;
  const effectiveSet = pool.reduce((best, s) => (s.weight > best.weight ? s : best));
  const lastWeight = effectiveSet.weight;

  const hitTop = effectiveSet.reps >= topOfRange;

  let status: OverloadStatus;
  if (!hitTop) {
    status = "none";
  } else {
    const rirValues = lastSets.map((s) => s.rir).filter((r): r is number => r != null);
    const hasRirData = rirValues.length > 0;
    const avgRir = hasRirData ? rirValues.reduce((a, b) => a + b, 0) / rirValues.length : null;

    if (!hasRirData || avgRir! >= 2) {
      status = "go_up";
    } else {
      status = "almost_ready";
    }
  }

  return {
    ready: status === "go_up",
    status,
    suggestedWeight: status === "go_up" ? lastWeight + exercise.increment : lastWeight,
    lastWeight,
    lastWeights,
    lastReps,
  };
}
