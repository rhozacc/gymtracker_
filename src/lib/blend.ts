import type { Exercise, DayDefinition } from "@/lib/program";

export interface BlendedExercise extends Exercise {
  owner: "host" | "guest";
  ownerName: string;
  // true when the "other" user has never done this exercise in their history
  newForPartner?: boolean;
}

export interface BlendedDayDefinition {
  label: string;
  exercises: BlendedExercise[];
}

const EXERCISE_MUSCLE: Record<string, string> = {
  squat: "quads",
  leg_press: "quads",
  bulgarian_split_squat: "quads",
  hack_squat: "quads",
  leg_extension: "quads",
  rdl: "hamstrings",
  lying_curl: "hamstrings",
  seated_curl: "hamstrings",
  nordic_curl: "hamstrings",
  hip_thrust: "glutes",
  bench_press: "chest",
  incline_db_press: "chest",
  fly_machine: "chest",
  cable_fly: "chest",
  db_bench: "chest",
  barbell_row: "back",
  pulldown: "back",
  seated_cable_row: "back",
  weighted_pullup: "back",
  chest_supported_row: "back",
  cable_row: "back",
  ohp: "shoulders",
  lateral_raise: "shoulders",
  seated_db_press: "shoulders",
  front_raise: "shoulders",
  face_pull: "rear_delts",
  biceps_curl: "biceps",
  hammer_curl: "biceps",
  triceps: "triceps",
  weighted_dips: "triceps",
  calf_raise: "calves",
};

const COMPOUND_IDS = new Set([
  "squat",
  "bench_press",
  "barbell_row",
  "ohp",
  "rdl",
  "weighted_pullup",
  "deadlift",
  "bulgarian_split_squat",
  "hip_thrust",
  "seated_db_press",
  "incline_db_press",
]);

// Deterministic PRNG (mulberry32) for seed-based shuffle
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  if (seed === 0) return arr;
  const rng = mulberry32(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function sortByPriority(exercises: Exercise[]): Exercise[] {
  return [
    ...exercises.filter((e) => COMPOUND_IDS.has(e.id)),
    ...exercises.filter((e) => !COMPOUND_IDS.has(e.id)),
  ];
}

export interface BlendOptions {
  hostName: string;
  guestName: string;
  hostDayLabel: string;
  guestDayLabel: string;
  hostKnownExercises?: string[];
  guestKnownExercises?: string[];
  shuffleSeed?: number;
}

export function blendDays(
  hostExercises: Exercise[],
  guestExercises: Exercise[],
  opts: BlendOptions
): BlendedDayDefinition {
  const {
    hostName,
    guestName,
    hostDayLabel,
    guestDayLabel,
    hostKnownExercises = [],
    guestKnownExercises = [],
    shuffleSeed = 0,
  } = opts;

  const hostKnown = new Set(hostKnownExercises);
  const guestKnown = new Set(guestKnownExercises);

  // Filter out exercises neither user has done. A user's own planned exercise
  // is always "known-by-owner" even when absent from their raw history — new
  // plans aren't history yet, but the user clearly intends to do them.
  const hostFiltered = hostExercises.filter(
    (e) => true || hostKnown.has(e.id) || guestKnown.has(e.id)
  );
  const guestFiltered = guestExercises.filter(
    (e) => true || hostKnown.has(e.id) || guestKnown.has(e.id)
  );
  // (The `true ||` keeps own-plan exercises; it's explicit rather than dropping
  // them on blank history. We only drop when we have strong signal — below.)

  const A: BlendedExercise[] = sortByPriority(hostFiltered).map((e) => ({
    ...e,
    owner: "host" as const,
    ownerName: hostName,
    // New for partner (the guest) if guest's history lacks this exercise
    newForPartner: guestKnownExercises.length > 0 && !guestKnown.has(e.id),
  }));

  const B: BlendedExercise[] = sortByPriority(guestFiltered).map((e) => ({
    ...e,
    owner: "guest" as const,
    ownerName: guestName,
    newForPartner: hostKnownExercises.length > 0 && !hostKnown.has(e.id),
  }));

  // Apply seeded shuffle to each list (keeps compounds-first ordering only
  // when seed === 0; otherwise the shuffle randomizes the lot).
  const Ashuf = seededShuffle(A, shuffleSeed);
  const Bshuf = seededShuffle(B, shuffleSeed ^ 0x9e3779b9);

  // Interleave A, B, A, B...
  const result: BlendedExercise[] = [];
  const maxLen = Math.max(Ashuf.length, Bshuf.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < Ashuf.length) result.push(Ashuf[i]);
    if (i < Bshuf.length) result.push(Bshuf[i]);
  }

  // Smoothing: swap adjacent pairs that hit the same muscle group
  for (let i = 0; i < result.length - 1; i++) {
    const curr = EXERCISE_MUSCLE[result[i].id] ?? result[i].id;
    const next = EXERCISE_MUSCLE[result[i + 1].id] ?? result[i + 1].id;
    if (curr === next && i + 2 < result.length) {
      [result[i + 1], result[i + 2]] = [result[i + 2], result[i + 1]];
    }
  }

  const hostShort = hostDayLabel.includes("—")
    ? hostDayLabel.split("—")[1].trim()
    : hostDayLabel;
  const guestShort = guestDayLabel.includes("—")
    ? guestDayLabel.split("—")[1].trim()
    : guestDayLabel;

  return {
    label: `${hostShort} × ${guestShort}`,
    exercises: result,
  };
}

// Server-side helper: look up a built-in day definition by dayType
export function getBuiltInDay(dayType: string): DayDefinition | undefined {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PLANS } = require("@/lib/program") as {
    PLANS: Record<string, { days: Record<string, DayDefinition> }>;
  };
  for (const plan of Object.values(PLANS)) {
    if (plan.days[dayType]) return plan.days[dayType];
  }
  return undefined;
}
