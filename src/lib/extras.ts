// ─── Session Extras: Abs / Cardio / Stretch add-on blocks ────────

export type ExtraExerciseMode = "reps" | "time";

export interface ExtraExercise {
  id: string;
  name: string;
  mode: ExtraExerciseMode;
  value: number; // reps count, or seconds if mode is "time"
  rest: number; // rest between exercises in seconds (0 = flow straight through)
}

export type ExtraCategory = "abs" | "cardio" | "stretch";

export interface ExtraOption {
  id: string;
  name: string;
  description: string;
  duration: string; // e.g. "~5 min"
  category: ExtraCategory;
  exercises: ExtraExercise[];
}

export interface ExtrasSelection {
  abs: string | null;
  cardio: string | null;
  stretch: string | null;
}

export const DEFAULT_SELECTION: ExtrasSelection = {
  abs: null,
  cardio: null,
  stretch: null,
};

// ─── ABS ─────────────────────────────────────────────────────────

const ABS_QUICK: ExtraOption = {
  id: "abs_quick",
  name: "Quick Core",
  description: "Fast 4-move core hit — in and out",
  duration: "~4 min",
  category: "abs",
  exercises: [
    { id: "aq_dead_bug", name: "Dead bug (per side)", mode: "reps", value: 10, rest: 10 },
    { id: "aq_plank", name: "Plank hold", mode: "time", value: 30, rest: 10 },
    { id: "aq_bicycle", name: "Bicycle crunches", mode: "reps", value: 20, rest: 10 },
    { id: "aq_reverse_crunch", name: "Reverse crunch", mode: "reps", value: 15, rest: 0 },
  ],
};

const ABS_CIRCUIT: ExtraOption = {
  id: "abs_circuit",
  name: "Core Circuit",
  description: "6 moves, moderate burn — hanging work and planks",
  duration: "~8 min",
  category: "abs",
  exercises: [
    { id: "ac_leg_raise", name: "Hanging leg raise", mode: "reps", value: 12, rest: 15 },
    { id: "ac_ab_wheel", name: "Ab wheel rollout", mode: "reps", value: 10, rest: 15 },
    { id: "ac_side_plank_l", name: "Side plank (left)", mode: "time", value: 30, rest: 0 },
    { id: "ac_side_plank_r", name: "Side plank (right)", mode: "time", value: 30, rest: 15 },
    { id: "ac_mountain", name: "Mountain climbers", mode: "reps", value: 20, rest: 10 },
    { id: "ac_hollow", name: "Hollow body hold", mode: "time", value: 30, rest: 0 },
  ],
};

const ABS_BURNER: ExtraOption = {
  id: "abs_burner",
  name: "Ab Burner",
  description: "8 moves, thorough and painful — the full treatment",
  duration: "~12 min",
  category: "abs",
  exercises: [
    { id: "ab_cable_crunch", name: "Cable crunch", mode: "reps", value: 15, rest: 15 },
    { id: "ab_leg_raise", name: "Hanging leg raise", mode: "reps", value: 12, rest: 15 },
    { id: "ab_plank", name: "Plank hold", mode: "time", value: 45, rest: 10 },
    { id: "ab_russian_twist", name: "Russian twist", mode: "reps", value: 20, rest: 10 },
    { id: "ab_toe_touch", name: "Toe touch crunch", mode: "reps", value: 15, rest: 10 },
    { id: "ab_side_plank_l", name: "Side plank (left)", mode: "time", value: 30, rest: 0 },
    { id: "ab_side_plank_r", name: "Side plank (right)", mode: "time", value: 30, rest: 10 },
    { id: "ab_flutter", name: "Flutter kicks", mode: "time", value: 30, rest: 0 },
  ],
};

// ─── CARDIO ──────────────────────────────────────────────────────

const CARDIO_QUICK: ExtraOption = {
  id: "cardio_quick",
  name: "Quick Finisher",
  description: "4-move blast — fast and done",
  duration: "~5 min",
  category: "cardio",
  exercises: [
    { id: "cq_jacks", name: "Jumping jacks", mode: "time", value: 30, rest: 10 },
    { id: "cq_burpees", name: "Burpees", mode: "reps", value: 10, rest: 10 },
    { id: "cq_high_knees", name: "High knees", mode: "time", value: 30, rest: 10 },
    { id: "cq_mountain", name: "Mountain climbers", mode: "time", value: 30, rest: 0 },
  ],
};

const CARDIO_HIIT: ExtraOption = {
  id: "cardio_hiit",
  name: "HIIT Circuit",
  description: "6 moves, mixed intensity — jump, row, slam",
  duration: "~10 min",
  category: "cardio",
  exercises: [
    { id: "ch_jump_squat", name: "Jump squats", mode: "reps", value: 15, rest: 15 },
    { id: "ch_burpees", name: "Burpees", mode: "reps", value: 10, rest: 15 },
    { id: "ch_mountain", name: "Mountain climbers", mode: "time", value: 30, rest: 10 },
    { id: "ch_box_jump", name: "Box jumps", mode: "reps", value: 12, rest: 15 },
    { id: "ch_battle_rope", name: "Battle rope slams", mode: "time", value: 30, rest: 10 },
    { id: "ch_row", name: "Rowing sprint", mode: "time", value: 60, rest: 0 },
  ],
};

const CARDIO_CONDITIONING: ExtraOption = {
  id: "cardio_conditioning",
  name: "Conditioning",
  description: "8 moves, longer grind — build that engine",
  duration: "~15 min",
  category: "cardio",
  exercises: [
    { id: "cc_bike", name: "Assault bike", mode: "time", value: 60, rest: 15 },
    { id: "cc_sled", name: "Sled push (or treadmill sprint)", mode: "time", value: 30, rest: 15 },
    { id: "cc_kb_swing", name: "Kettlebell swings", mode: "reps", value: 20, rest: 15 },
    { id: "cc_box_jump", name: "Box jumps", mode: "reps", value: 15, rest: 15 },
    { id: "cc_jump_rope", name: "Jump rope", mode: "time", value: 60, rest: 15 },
    { id: "cc_row", name: "Rowing sprint", mode: "time", value: 60, rest: 15 },
    { id: "cc_burpees", name: "Burpees", mode: "reps", value: 12, rest: 10 },
    { id: "cc_farmer", name: "Farmer's walk", mode: "time", value: 40, rest: 0 },
  ],
};

// ─── STRETCH ─────────────────────────────────────────────────────

const STRETCH_QUICK: ExtraOption = {
  id: "stretch_quick",
  name: "Quick Stretch",
  description: "Bare minimum — hit the big ones and go",
  duration: "~3 min",
  category: "stretch",
  exercises: [
    { id: "sq_quad_l", name: "Quad stretch (left)", mode: "time", value: 30, rest: 0 },
    { id: "sq_quad_r", name: "Quad stretch (right)", mode: "time", value: 30, rest: 0 },
    { id: "sq_shoulder_l", name: "Shoulder stretch (left)", mode: "time", value: 20, rest: 0 },
    { id: "sq_shoulder_r", name: "Shoulder stretch (right)", mode: "time", value: 20, rest: 0 },
    { id: "sq_hamstring", name: "Standing hamstring reach", mode: "time", value: 30, rest: 0 },
    { id: "sq_chest", name: "Chest doorway stretch", mode: "time", value: 20, rest: 0 },
  ],
};

const STRETCH_COOLDOWN: ExtraOption = {
  id: "stretch_cooldown",
  name: "Cooldown",
  description: "7-min unwind — hips, hamstrings, shoulders, spine",
  duration: "~7 min",
  category: "stretch",
  exercises: [
    { id: "sc_cat_cow", name: "Cat-cow", mode: "time", value: 30, rest: 0 },
    { id: "sc_child", name: "Child's pose", mode: "time", value: 30, rest: 0 },
    { id: "sc_pigeon_l", name: "Pigeon stretch (left)", mode: "time", value: 30, rest: 0 },
    { id: "sc_pigeon_r", name: "Pigeon stretch (right)", mode: "time", value: 30, rest: 0 },
    { id: "sc_ham_l", name: "Seated hamstring (left)", mode: "time", value: 30, rest: 0 },
    { id: "sc_ham_r", name: "Seated hamstring (right)", mode: "time", value: 30, rest: 0 },
    { id: "sc_shoulder_l", name: "Shoulder stretch (left)", mode: "time", value: 20, rest: 0 },
    { id: "sc_shoulder_r", name: "Shoulder stretch (right)", mode: "time", value: 20, rest: 0 },
    { id: "sc_twist_l", name: "Spinal twist (left)", mode: "time", value: 30, rest: 0 },
    { id: "sc_twist_r", name: "Spinal twist (right)", mode: "time", value: 30, rest: 0 },
    { id: "sc_calf_l", name: "Calf stretch (left)", mode: "time", value: 20, rest: 0 },
    { id: "sc_calf_r", name: "Calf stretch (right)", mode: "time", value: 20, rest: 0 },
  ],
};

const STRETCH_MOBILITY: ExtraOption = {
  id: "stretch_mobility",
  name: "Full Mobility",
  description: "Deep work — foam rolling, hip openers, the lot",
  duration: "~12 min",
  category: "stretch",
  exercises: [
    { id: "sm_foam_quad", name: "Foam roll quads", mode: "time", value: 45, rest: 0 },
    { id: "sm_foam_lat", name: "Foam roll lats", mode: "time", value: 45, rest: 0 },
    { id: "sm_9090_l", name: "90/90 hip (left)", mode: "time", value: 30, rest: 0 },
    { id: "sm_9090_r", name: "90/90 hip (right)", mode: "time", value: 30, rest: 0 },
    { id: "sm_pigeon_l", name: "Pigeon stretch (left)", mode: "time", value: 45, rest: 0 },
    { id: "sm_pigeon_r", name: "Pigeon stretch (right)", mode: "time", value: 45, rest: 0 },
    { id: "sm_wgs_l", name: "World's greatest stretch (left)", mode: "time", value: 30, rest: 0 },
    { id: "sm_wgs_r", name: "World's greatest stretch (right)", mode: "time", value: 30, rest: 0 },
    { id: "sm_needle_l", name: "Thread the needle (left)", mode: "time", value: 30, rest: 0 },
    { id: "sm_needle_r", name: "Thread the needle (right)", mode: "time", value: 30, rest: 0 },
    { id: "sm_couch_l", name: "Couch stretch (left)", mode: "time", value: 30, rest: 0 },
    { id: "sm_couch_r", name: "Couch stretch (right)", mode: "time", value: 30, rest: 0 },
    { id: "sm_ham_l", name: "Lying hamstring (left)", mode: "time", value: 30, rest: 0 },
    { id: "sm_ham_r", name: "Lying hamstring (right)", mode: "time", value: 30, rest: 0 },
    { id: "sm_chest", name: "Chest doorway stretch", mode: "time", value: 30, rest: 0 },
  ],
};

// ─── Registry ────────────────────────────────────────────────────

export const EXTRAS: Record<string, ExtraOption> = {
  [ABS_QUICK.id]: ABS_QUICK,
  [ABS_CIRCUIT.id]: ABS_CIRCUIT,
  [ABS_BURNER.id]: ABS_BURNER,
  [CARDIO_QUICK.id]: CARDIO_QUICK,
  [CARDIO_HIIT.id]: CARDIO_HIIT,
  [CARDIO_CONDITIONING.id]: CARDIO_CONDITIONING,
  [STRETCH_QUICK.id]: STRETCH_QUICK,
  [STRETCH_COOLDOWN.id]: STRETCH_COOLDOWN,
  [STRETCH_MOBILITY.id]: STRETCH_MOBILITY,
};

export const EXTRAS_BY_CATEGORY: Record<ExtraCategory, ExtraOption[]> = {
  abs: [ABS_QUICK, ABS_CIRCUIT, ABS_BURNER],
  cardio: [CARDIO_QUICK, CARDIO_HIIT, CARDIO_CONDITIONING],
  stretch: [STRETCH_QUICK, STRETCH_COOLDOWN, STRETCH_MOBILITY],
};

export const CATEGORY_INFO: Record<ExtraCategory, { label: string; description: string }> = {
  abs: { label: "Abs", description: "Core work — pick your poison" },
  cardio: { label: "Cardio", description: "Finishers — get the heart rate up" },
  stretch: { label: "Stretch", description: "Cooldown — don't skip this" },
};

/** Get resolved ExtraOption[] for a selection (in order: abs, cardio, stretch) */
export function getSelectedExtras(selection: ExtrasSelection): ExtraOption[] {
  const result: ExtraOption[] = [];
  if (selection.abs && EXTRAS[selection.abs]) result.push(EXTRAS[selection.abs]);
  if (selection.cardio && EXTRAS[selection.cardio]) result.push(EXTRAS[selection.cardio]);
  if (selection.stretch && EXTRAS[selection.stretch]) result.push(EXTRAS[selection.stretch]);
  return result;
}

/** Format an exercise value for display: "20 reps" or "30s" */
export function formatExtraValue(ex: ExtraExercise): string {
  if (ex.mode === "time") {
    return ex.value >= 60 ? `${Math.floor(ex.value / 60)}m ${ex.value % 60 ? (ex.value % 60) + "s" : ""}`.trim() : `${ex.value}s`;
  }
  return `${ex.value} reps`;
}
