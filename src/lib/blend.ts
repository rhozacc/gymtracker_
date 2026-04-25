import type { Exercise, DayDefinition } from "@/lib/program";

export interface BlendedExercise extends Exercise {
  owner: "host" | "guest" | "shared";
  ownerName: string;
  /** Featured shared lift — both users do the same exercise as a head-to-head. */
  isHero?: boolean;
  /** True when the partner has never done this exercise in their history. */
  newForPartner?: boolean;
}

export interface BlendedDayDefinition {
  label: string;
  exercises: BlendedExercise[];
}

// Output caps — keep blended sessions punchy, not the sum of two whole days
const TOTAL_CAP = 7;
const HERO_CAP = 2;
const PRIMARY_COMPOUND_CAP = 2;

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

function muscleOf(ex: Exercise): string {
  return EXERCISE_MUSCLE[ex.id] ?? ex.id;
}

function isCompound(ex: Exercise): boolean {
  return COMPOUND_IDS.has(ex.id);
}

// Deterministic PRNG (mulberry32) for seed-based variation
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
    ...exercises.filter(isCompound),
    ...exercises.filter((e) => !isCompound(e)),
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

/**
 * Blend two planned days into a curated shared session.
 *
 * The output is NOT a 1:1 zip of both days. It's three layered picks:
 *
 *   1. **Heroes (≤2)** — exercises both users have on their day. Both users
 *      do them — head-to-head moments. Tagged `owner: "shared"`.
 *   2. **Primary compounds (≤2)** — biggest unique compounds from each side,
 *      one per owner if available. Tagged `owner: "host"` / `"guest"`.
 *   3. **Variety accessories** — fill remaining slots up to TOTAL_CAP=7,
 *      scored by new-muscle-coverage and partner-familiarity. Owner-balanced
 *      so neither side dominates.
 *
 * Final pass smooths same-muscle adjacents.
 */
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

  const used = new Set<string>();

  // ── 1. HEROES ──────────────────────────────────────────────────────────
  // Exercises both users have on their day. Both do them as a head-to-head.
  const hostIds = new Set(hostExercises.map((e) => e.id));
  const sharedExercises = guestExercises.filter((e) => hostIds.has(e.id));
  const sharedSorted = seededShuffle(sortByPriority(sharedExercises), shuffleSeed);
  const heroes: BlendedExercise[] = [];
  for (const ex of sharedSorted) {
    if (heroes.length >= HERO_CAP) break;
    heroes.push({
      ...ex,
      owner: "shared",
      ownerName: `${hostName} & ${guestName}`,
      isHero: true,
    });
    used.add(ex.id);
  }

  // ── 2. PRIMARY COMPOUNDS ───────────────────────────────────────────────
  // Pick 1 unique compound per side, alternating, up to PRIMARY_COMPOUND_CAP.
  const hostUniqCompounds = seededShuffle(
    hostExercises.filter((e) => !used.has(e.id) && isCompound(e)),
    shuffleSeed ^ 0x9e3779b9
  );
  const guestUniqCompounds = seededShuffle(
    guestExercises.filter((e) => !used.has(e.id) && isCompound(e)),
    shuffleSeed ^ 0x517cc1b7
  );
  const primary: BlendedExercise[] = [];
  let h = 0;
  let g = 0;
  while (
    primary.length < PRIMARY_COMPOUND_CAP &&
    (h < hostUniqCompounds.length || g < guestUniqCompounds.length)
  ) {
    if (h < hostUniqCompounds.length && primary.length < PRIMARY_COMPOUND_CAP) {
      const ex = hostUniqCompounds[h++];
      if (!used.has(ex.id)) {
        primary.push({
          ...ex,
          owner: "host",
          ownerName: hostName,
          newForPartner: guestKnownExercises.length > 0 && !guestKnown.has(ex.id),
        });
        used.add(ex.id);
      }
    }
    if (g < guestUniqCompounds.length && primary.length < PRIMARY_COMPOUND_CAP) {
      const ex = guestUniqCompounds[g++];
      if (!used.has(ex.id)) {
        primary.push({
          ...ex,
          owner: "guest",
          ownerName: guestName,
          newForPartner: hostKnownExercises.length > 0 && !hostKnown.has(ex.id),
        });
        used.add(ex.id);
      }
    }
  }

  // ── 3. VARIETY ACCESSORIES ─────────────────────────────────────────────
  // Score remaining unique exercises by:
  //   +10 if their muscle group isn't yet represented (variety bonus)
  //   +1  if the partner has done this exercise before (familiar)
  //   +small seeded jitter for shuffle-driven variation
  const remainingSlots = Math.max(0, TOTAL_CAP - heroes.length - primary.length);
  const muscleSeen = new Set<string>();
  [...heroes, ...primary].forEach((e) => muscleSeen.add(muscleOf(e)));

  type Candidate = { ex: Exercise; owner: "host" | "guest"; score: number };
  const rng = mulberry32(shuffleSeed ^ 0x85ebca6b);
  const candidates: Candidate[] = [];
  for (const ex of hostExercises) {
    if (used.has(ex.id)) continue;
    let score = muscleSeen.has(muscleOf(ex)) ? 0 : 10;
    if (guestKnown.has(ex.id)) score += 1;
    score += rng() * 0.5;
    candidates.push({ ex, owner: "host", score });
  }
  for (const ex of guestExercises) {
    if (used.has(ex.id)) continue;
    let score = muscleSeen.has(muscleOf(ex)) ? 0 : 10;
    if (hostKnown.has(ex.id)) score += 1;
    score += rng() * 0.5;
    candidates.push({ ex, owner: "guest", score });
  }
  candidates.sort((a, b) => b.score - a.score);

  const accessories: BlendedExercise[] = [];
  const ownerCount = { host: 0, guest: 0 };
  for (const c of candidates) {
    if (accessories.length >= remainingSlots) break;
    if (used.has(c.ex.id)) continue;
    // Balance: don't let one side dominate by more than 1
    const otherOwner = c.owner === "host" ? "guest" : "host";
    if (ownerCount[c.owner] > ownerCount[otherOwner] + 1) continue;

    const newForPartner =
      c.owner === "host"
        ? guestKnownExercises.length > 0 && !guestKnown.has(c.ex.id)
        : hostKnownExercises.length > 0 && !hostKnown.has(c.ex.id);

    accessories.push({
      ...c.ex,
      owner: c.owner,
      ownerName: c.owner === "host" ? hostName : guestName,
      newForPartner,
    });
    used.add(c.ex.id);
    muscleSeen.add(muscleOf(c.ex));
    ownerCount[c.owner]++;
  }

  // ── Order: heroes → primary → accessories ─────────────────────────────
  const result: BlendedExercise[] = [...heroes, ...primary, ...accessories];

  // Smoothing: nudge same-muscle adjacents apart
  for (let i = 0; i < result.length - 1; i++) {
    const curr = muscleOf(result[i]);
    const next = muscleOf(result[i + 1]);
    if (curr === next && i + 2 < result.length) {
      [result[i + 1], result[i + 2]] = [result[i + 2], result[i + 1]];
    }
  }

  // ── Label ──────────────────────────────────────────────────────────────
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
