import { estimateE1RM } from "./e1rm";

export interface MomentumInput {
  date: string;
  sets: { exerciseId: string; reps: number; weight: number }[];
  debrief: { energy: number; pump: number; mood: number } | null;
}

export interface MomentumResult {
  score: number;       // 0–100 integer
  frequency: number;   // 0–1 raw component
  progression: number; // 0–1 raw component
  recovery: number;    // 0–1 raw component
  sessionCount: number;
}

export function computeMomentumScore(sessions: MomentumInput[]): MomentumResult {
  const nowMs = Date.now();
  const DAY_MS = 86_400_000;
  const cutoff28 = nowMs - 28 * DAY_MS;
  const cutoff14 = nowMs - 14 * DAY_MS;

  const window = sessions.filter((s) => new Date(s.date).getTime() >= cutoff28);

  if (window.length === 0) {
    return { score: 0, frequency: 0, progression: 0, recovery: 0, sessionCount: 0 };
  }

  // ── FREQUENCY (30%) ──────────────────────────────────────────────────────────
  const weekBuckets = new Set<number>();
  for (const s of window) {
    const ageMs = nowMs - new Date(s.date).getTime();
    weekBuckets.add(Math.min(Math.floor(ageMs / (7 * DAY_MS)), 3));
  }
  const freqBase = weekBuckets.size / 4;
  const freqDensity = Math.min(window.length / 12, 1.0);
  const frequency = freqBase * 0.6 + freqDensity * 0.4;

  // ── PROGRESSION (50%) ────────────────────────────────────────────────────────
  const recentE1rm: Record<string, number> = {};
  const olderE1rm: Record<string, number> = {};

  for (const s of window) {
    const isRecent = new Date(s.date).getTime() >= cutoff14;
    const target = isRecent ? recentE1rm : olderE1rm;
    for (const set of s.sets) {
      const e = estimateE1RM(set.weight, set.reps);
      if (e > (target[set.exerciseId] ?? 0)) {
        target[set.exerciseId] = e;
      }
    }
  }

  const commonExercises = Object.keys(recentE1rm).filter(
    (id) => olderE1rm[id] !== undefined && olderE1rm[id] > 0
  );

  let progression: number;
  if (commonExercises.length === 0) {
    progression = 0.45;
  } else {
    const scores = commonExercises.map((id) => {
      const delta = (recentE1rm[id] - olderE1rm[id]) / olderE1rm[id];
      const clamped = Math.max(-0.1, Math.min(0.15, delta));
      // [-0.10, +0.15] → [0.0, 1.0]; 0% maps to 0.40 (penalizes spinning wheels)
      return (clamped + 0.1) / 0.25;
    });
    progression = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  // ── RECOVERY (20%) ───────────────────────────────────────────────────────────
  const debriefs = window
    .filter((s) => s.debrief !== null)
    .slice(-8)
    .map((s) => s.debrief!);

  const debriefScore =
    debriefs.length > 0
      ? debriefs.reduce((sum, d) => sum + (d.energy + d.mood) / 20, 0) / debriefs.length
      : 0.6;

  // Penalise consecutive training days
  const trainingDays = new Set(
    window.map((s) => new Date(s.date).toISOString().split("T")[0])
  );
  let consecutivePairs = 0;
  for (const dateStr of trainingDays) {
    const next = new Date(new Date(dateStr).getTime() + DAY_MS)
      .toISOString()
      .split("T")[0];
    if (trainingDays.has(next)) consecutivePairs++;
  }
  const consecutivePenalty = Math.min(consecutivePairs * 0.03, 0.15);
  const recovery = Math.max(0, debriefScore - consecutivePenalty);

  // ── COMPOSITE ────────────────────────────────────────────────────────────────
  const raw = frequency * 0.3 + progression * 0.5 + recovery * 0.2;
  const score = Math.max(0, Math.min(100, Math.round(raw * 100)));

  return { score, frequency, progression, recovery, sessionCount: window.length };
}
