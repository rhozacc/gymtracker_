export type TierName = "novice" | "intermediate" | "advanced" | "elite";

export const TIER_ORDER: TierName[] = ["novice", "intermediate", "advanced", "elite"];

export interface Standard {
  tiers: Record<TierName, number>; // bodyweight multipliers for E1RM
}

// Bodyweight-relative 1RM standards (male-normalised, widely cited figures)
const STANDARDS: Record<string, Standard> = {
  bench_press: { tiers: { novice: 0.75, intermediate: 1.0, advanced: 1.5, elite: 2.0 } },
  squat:       { tiers: { novice: 1.0,  intermediate: 1.5, advanced: 2.0, elite: 2.5 } },
  deadlift:    { tiers: { novice: 1.25, intermediate: 1.75, advanced: 2.5, elite: 3.0 } },
  ohp:         { tiers: { novice: 0.5,  intermediate: 0.75, advanced: 1.0, elite: 1.25 } },
  barbell_row: { tiers: { novice: 0.75, intermediate: 1.0, advanced: 1.5, elite: 1.75 } },
  rdl:         { tiers: { novice: 0.85, intermediate: 1.25, advanced: 1.75, elite: 2.25 } },
};

export interface Standing {
  currentTier: TierName | null; // null = below novice
  nextTier: TierName | null;    // null = already elite
  nextThresholdKg: number | null;
  thresholds: Record<TierName, number>; // absolute kg values at user's bodyweight
}

export function getStandard(exerciseId: string): Standard | null {
  return STANDARDS[exerciseId] ?? null;
}

export function computeStanding(
  e1rmKg: number,
  bodyweightKg: number,
  standard: Standard
): Standing {
  const thresholds = Object.fromEntries(
    TIER_ORDER.map((t) => [t, Math.round(standard.tiers[t] * bodyweightKg * 10) / 10])
  ) as Record<TierName, number>;

  let currentTier: TierName | null = null;
  for (const t of TIER_ORDER) {
    if (e1rmKg >= thresholds[t]) currentTier = t;
  }

  const tierIdx = currentTier !== null ? TIER_ORDER.indexOf(currentTier) : -1;
  const nextTier = tierIdx < TIER_ORDER.length - 1 ? TIER_ORDER[tierIdx + 1] : null;
  const nextThresholdKg = nextTier ? thresholds[nextTier] : null;

  return { currentTier, nextTier, nextThresholdKg, thresholds };
}

export function linearRegressionSlope(
  points: { date: string; e1rm: number }[]
): number {
  if (points.length < 2) return 0;
  const DAY_MS = 86_400_000;
  const firstMs = new Date(points[0].date).getTime();
  const reg = points.map((p) => ({
    x: (new Date(p.date).getTime() - firstMs) / DAY_MS,
    y: p.e1rm,
  }));
  const n = reg.length;
  const sumX = reg.reduce((s, p) => s + p.x, 0);
  const sumY = reg.reduce((s, p) => s + p.y, 0);
  const sumXY = reg.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = reg.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}
