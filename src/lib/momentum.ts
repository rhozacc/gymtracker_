import { estimateE1RM } from "./e1rm";
import { MUSCLE_GROUPS, type MuscleGroup } from "./muscleGroups";
import { MEV_TARGETS, MAV_TARGETS } from "./volume-targets";
import { computeMuscleVolume, type MuscleContributions } from "./muscle-volume";

export interface MomentumInput {
  date: string;
  sets: { exerciseId: string; reps: number; weight: number }[];
  debrief: { energy: number; pump: number; mood: number } | null;
}

export type TierLabel = "Atrophy" | "Maintenance" | "Hypertrophy" | "Peak";

export interface MomentumTier {
  label: TierLabel;
  subtitle: string;
}

export interface GroupVolume {
  group: MuscleGroup;
  score: number;       // 0–1
  weeklySets: number;  // contribution-weighted weekly sets
  mev: number;
  mav: number;
}

export interface WorstExercise {
  id: string;
  deltaPct: number; // signed, e.g. -0.07 = down 7%
}

export interface ExerciseDelta {
  id: string;
  deltaPct: number;     // signed, e.g. -0.07 = down 7%
  recentE1rm: number;   // best E1RM in the recent (0–14d) window
  olderE1rm: number;    // best E1RM in the older (14–28d) window
}

export interface RecoverySummary {
  avgEnergy: number | null;   // 1–10 scale, null when no debriefs in window
  avgMood: number | null;     // 1–10 scale, null when no debriefs in window
  debriefCount: number;       // debriefs counted toward the average (≤8)
  consecutivePairs: number;   // back-to-back training-day pairs in window
}

export interface MomentumResult {
  // Two primary axes (drive the meter + tier)
  volume: number;          // 0–1
  progression: number;     // 0–1
  sustainability: number;  // 0–1 (modifier only)

  // Tier
  tier: MomentumTier;

  // Diagnostic line (already resolved to display strings)
  limiter: string;

  // Plain-English readouts for each axis
  volumeReadout: string;
  progressionReadout: string;

  // Diagnostics
  groupVolumes: GroupVolume[];
  exercisesTracked: number;
  exercisesImproving: number;
  worstExercise: WorstExercise | null;
  exerciseDeltas: ExerciseDelta[]; // every common exercise, sorted by delta asc
  recovery: RecoverySummary;

  // Stats kept for back-compat / sorting
  sessionCount: number;
  score: number;           // 0–100, internal
}

export interface MomentumOptions {
  contributions?: MuscleContributions;
  // Resolves exerciseId → display name. Used to render the limiter line
  // (e.g. "Bench Press is flat"). When omitted, falls back to a generic phrase.
  exerciseName?: (id: string) => string | null | undefined;
}

const SUBTITLES: Record<TierLabel, string> = {
  Atrophy:     "losing ground",
  Maintenance: "holding steady",
  Hypertrophy: "building",
  Peak:        "firing",
};

const TIER_ORDER: TierLabel[] = ["Atrophy", "Maintenance", "Hypertrophy", "Peak"];

function downgrade(tier: TierLabel): TierLabel {
  const idx = TIER_ORDER.indexOf(tier);
  return idx > 0 ? TIER_ORDER[idx - 1] : tier;
}

function classify(V: number, P: number, S: number): TierLabel {
  let tier: TierLabel;
  if (V >= 0.7 && P >= 0.7) tier = "Peak";
  else if (V >= 0.4 && P >= 0.4) tier = "Hypertrophy";
  else if (V >= 0.4 && P <  0.4) tier = "Maintenance";
  else if (V <  0.4 && P >= 0.4) tier = "Hypertrophy"; // newbie / undertrained-but-PR'ing
  else                            tier = "Atrophy";

  if (S < 0.4 && tier !== "Atrophy") tier = downgrade(tier);
  return tier;
}

function volumeReadoutFor(v: number): string {
  if (v < 0.25) return "below MEV";
  if (v < 0.5)  return "approaching MEV";
  if (v < 0.75) return "above MEV";
  return "near MAV";
}

function progressionReadoutFor(p: number, tracked: number): string {
  if (tracked === 0) return "no shared lifts";
  if (p < 0.3)  return "declining";
  if (p < 0.5)  return "flat";
  if (p < 0.75) return "climbing";
  return "PR-ing";
}

export function computeMomentumScore(
  sessions: MomentumInput[],
  options: MomentumOptions = {},
): MomentumResult {
  const contributions = options.contributions ?? {};
  const nameOf = options.exerciseName;

  const nowMs = Date.now();
  const DAY_MS = 86_400_000;
  const cutoff28 = nowMs - 28 * DAY_MS;
  const cutoff14 = nowMs - 14 * DAY_MS;

  const window = sessions.filter((s) => new Date(s.date).getTime() >= cutoff28);

  if (window.length === 0) {
    return {
      volume: 0,
      progression: 0,
      sustainability: 0,
      tier: { label: "Atrophy", subtitle: SUBTITLES.Atrophy },
      limiter: "No sessions logged in the last 28 days",
      volumeReadout: "below MEV",
      progressionReadout: "no shared lifts",
      groupVolumes: MUSCLE_GROUPS.map((g) => ({
        group: g,
        score: 0,
        weeklySets: 0,
        mev: MEV_TARGETS[g],
        mav: MAV_TARGETS[g],
      })),
      exercisesTracked: 0,
      exercisesImproving: 0,
      worstExercise: null,
      exerciseDeltas: [],
      recovery: { avgEnergy: null, avgMood: null, debriefCount: 0, consecutivePairs: 0 },
      sessionCount: 0,
      score: 0,
    };
  }

  // ── VOLUME ─────────────────────────────────────────────────────────────────
  const totals = computeMuscleVolume(window, contributions, 28);
  const groupVolumes: GroupVolume[] = MUSCLE_GROUPS.map((g) => {
    const weeklySets = totals[g] / 4; // 28-day window → /4 for weekly
    const mev = MEV_TARGETS[g];
    const mav = MAV_TARGETS[g];
    const floor = Math.max(0, Math.min(1, weeklySets / mev));
    const target = Math.max(0, Math.min(1, (weeklySets - mev) / Math.max(1, mav - mev)));
    const score = 0.5 * floor + 0.5 * target;
    return { group: g, score, weeklySets, mev, mav };
  });
  const V = groupVolumes.reduce((sum, g) => sum + g.score, 0) / MUSCLE_GROUPS.length;

  // ── PROGRESSION ────────────────────────────────────────────────────────────
  const recentE1rm: Record<string, number> = {};
  const olderE1rm: Record<string, number> = {};

  for (const s of window) {
    const isRecent = new Date(s.date).getTime() >= cutoff14;
    const target = isRecent ? recentE1rm : olderE1rm;
    for (const set of s.sets) {
      const e = estimateE1RM(set.weight, set.reps);
      if (e > (target[set.exerciseId] ?? 0)) target[set.exerciseId] = e;
    }
  }

  const commonExercises = Object.keys(recentE1rm).filter(
    (id) => olderE1rm[id] !== undefined && olderE1rm[id] > 0,
  );

  const exercisesTracked = commonExercises.length;
  const exercisesImproving = commonExercises.filter((id) => recentE1rm[id] > olderE1rm[id]).length;

  let progression: number;
  let worstExercise: WorstExercise | null = null;
  let exerciseDeltas: ExerciseDelta[] = [];

  if (exercisesTracked === 0) {
    progression = 0.45;
  } else {
    const deltas = commonExercises.map((id) => ({
      id,
      delta: (recentE1rm[id] - olderE1rm[id]) / olderE1rm[id],
    }));

    progression =
      deltas
        .map(({ delta }) => {
          const clamped = Math.max(-0.1, Math.min(0.15, delta));
          return (clamped + 0.1) / 0.25;
        })
        .reduce((a, b) => a + b, 0) / deltas.length;

    const lowest = deltas.reduce((a, b) => (b.delta < a.delta ? b : a));
    worstExercise = { id: lowest.id, deltaPct: lowest.delta };

    exerciseDeltas = deltas
      .map(({ id, delta }) => ({
        id,
        deltaPct: delta,
        recentE1rm: recentE1rm[id],
        olderE1rm: olderE1rm[id],
      }))
      .sort((a, b) => a.deltaPct - b.deltaPct);
  }

  // ── SUSTAINABILITY (modifier only) ─────────────────────────────────────────
  const debriefs = window
    .filter((s) => s.debrief !== null)
    .slice(-8)
    .map((s) => s.debrief!);

  const debriefScore =
    debriefs.length > 0
      ? debriefs.reduce((sum, d) => sum + (d.energy + d.mood) / 20, 0) / debriefs.length
      : 0.6;

  const avgEnergy =
    debriefs.length > 0
      ? debriefs.reduce((sum, d) => sum + d.energy, 0) / debriefs.length
      : null;
  const avgMood =
    debriefs.length > 0
      ? debriefs.reduce((sum, d) => sum + d.mood, 0) / debriefs.length
      : null;

  const trainingDays = new Set(
    window.map((s) => new Date(s.date).toISOString().split("T")[0]),
  );
  let consecutivePairs = 0;
  for (const dateStr of Array.from(trainingDays)) {
    const next = new Date(new Date(dateStr).getTime() + DAY_MS)
      .toISOString()
      .split("T")[0];
    if (trainingDays.has(next)) consecutivePairs++;
  }
  const consecutivePenalty = Math.min(consecutivePairs * 0.03, 0.15);
  const sustainability = Math.max(0, debriefScore - consecutivePenalty);

  const recovery: RecoverySummary = {
    avgEnergy,
    avgMood,
    debriefCount: debriefs.length,
    consecutivePairs,
  };

  // ── TIER ───────────────────────────────────────────────────────────────────
  const tierLabel = classify(V, progression, sustainability);
  const tier: MomentumTier = { label: tierLabel, subtitle: SUBTITLES[tierLabel] };

  // ── LIMITER ────────────────────────────────────────────────────────────────
  const limiter = computeLimiter({
    V,
    P: progression,
    S: sustainability,
    groupVolumes,
    exercisesTracked,
    worstExercise,
    nameOf,
  });

  // ── COMPOSITE (internal) ───────────────────────────────────────────────────
  const sustainPenalty = sustainability < 0.4 ? (0.4 - sustainability) * 0.375 : 0; // max ~0.15
  const raw = V * 0.5 + progression * 0.5 - sustainPenalty;
  const score = Math.max(0, Math.min(100, Math.round(raw * 100)));

  return {
    volume: V,
    progression,
    sustainability,
    tier,
    limiter,
    volumeReadout: volumeReadoutFor(V),
    progressionReadout: progressionReadoutFor(progression, exercisesTracked),
    groupVolumes,
    exercisesTracked,
    exercisesImproving,
    worstExercise,
    exerciseDeltas,
    recovery,
    sessionCount: window.length,
    score,
  };
}

interface LimiterArgs {
  V: number;
  P: number;
  S: number;
  groupVolumes: GroupVolume[];
  exercisesTracked: number;
  worstExercise: WorstExercise | null;
  nameOf: ((id: string) => string | null | undefined) | undefined;
}

function computeLimiter({
  V,
  P,
  S,
  groupVolumes,
  exercisesTracked,
  worstExercise,
  nameOf,
}: LimiterArgs): string {
  // 1. Sustainability red and worst signal
  if (S < 0.4 && S < V && S < P) {
    return "recovery dragging — add a rest day";
  }

  // 2. Volume red
  if (V < P && V < 0.5) {
    const sortedGroups = [...groupVolumes].sort((a, b) => a.score - b.score);
    const lowest = sortedGroups[0];
    if (lowest && lowest.weeklySets < lowest.mev) {
      return `${lowest.group.toLowerCase()} is the limiter — under MEV`;
    }
    return "volume is the limiter — push through MEV";
  }

  // 3. Progression red
  if (P < V && P < 0.5) {
    if (exercisesTracked === 0) {
      return "train the same lifts week to week to track progress";
    }
    if (worstExercise && worstExercise.deltaPct < 0.01) {
      const name = nameOf?.(worstExercise.id);
      if (name) return `${name} is flat — try adding weight`;
      return "your weakest lift is flat — try adding weight";
    }
    return "progression mixed — revisit your loading plan";
  }

  // 4. Both strong
  if (V >= 0.7 && P >= 0.7) {
    return "both axes firing — keep loading";
  }

  // 5. Default — name the slightly weaker side
  if (V <= P) {
    return "edge up your weekly sets to keep building";
  }
  if (worstExercise && worstExercise.deltaPct < 0.01) {
    const name = nameOf?.(worstExercise.id);
    if (name) return `${name} is flat — try adding weight`;
  }
  return "keep stacking sessions";
}
