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
  lastReps: number[];
}

export function checkOverload(
  exercise: Exercise,
  lastSets: SetData[]
): OverloadResult {
  if (lastSets.length === 0) {
    return { ready: false, status: "none", suggestedWeight: 0, lastWeight: 0, lastReps: [] };
  }

  const lastWeight = Math.max(...lastSets.map((s) => s.weight));
  const lastReps = lastSets.map((s) => s.reps);
  const topOfRange = exercise.repRange[1];
  const allHitTop = lastSets.every((s) => s.reps >= topOfRange);

  // Determine status using RIR when available
  let status: OverloadStatus;
  if (!allHitTop) {
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
    lastReps,
  };
}
