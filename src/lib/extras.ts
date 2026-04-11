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

// ─── ABS — additional ────────────────────────────────────────────

const ABS_LOWER: ExtraOption = {
  id: "abs_lower",
  name: "Lower Abs",
  description: "Hips up, legs up — pure lower ab punishment",
  duration: "~6 min",
  category: "abs",
  exercises: [
    { id: "al_reverse",  name: "Reverse crunch",       mode: "reps", value: 15, rest: 10 },
    { id: "al_raise",    name: "Lying leg raise",       mode: "reps", value: 12, rest: 10 },
    { id: "al_scissors", name: "Scissor kicks",         mode: "time", value: 30, rest: 10 },
    { id: "al_tuck",     name: "Tuck crunch",           mode: "reps", value: 15, rest: 10 },
    { id: "al_flutter",  name: "Flutter kicks",         mode: "time", value: 30, rest: 10 },
    { id: "al_knee_tuck",name: "Plank knee tuck",       mode: "reps", value: 20, rest: 0  },
  ],
};

const ABS_OBLIQUE: ExtraOption = {
  id: "abs_oblique",
  name: "Oblique Work",
  description: "Rotation, side planks, and lateral control",
  duration: "~7 min",
  category: "abs",
  exercises: [
    { id: "ao_russian",     name: "Russian twist",            mode: "reps", value: 20, rest: 10 },
    { id: "ao_sp_l",        name: "Side plank (left)",        mode: "time", value: 40, rest: 5  },
    { id: "ao_sp_r",        name: "Side plank (right)",       mode: "time", value: 40, rest: 10 },
    { id: "ao_bicycle",     name: "Bicycle crunch",           mode: "reps", value: 20, rest: 10 },
    { id: "ao_hip_dip_l",   name: "Plank hip dip (left)",     mode: "reps", value: 15, rest: 0  },
    { id: "ao_hip_dip_r",   name: "Plank hip dip (right)",    mode: "reps", value: 15, rest: 10 },
    { id: "ao_wipers",      name: "Windshield wipers",        mode: "reps", value: 10, rest: 0  },
  ],
};

const ABS_WEIGHTED: ExtraOption = {
  id: "abs_weighted",
  name: "Weighted Core",
  description: "Cable, dumbbell, and pallof — add resistance",
  duration: "~9 min",
  category: "abs",
  exercises: [
    { id: "aw_cable",      name: "Cable crunch",              mode: "reps", value: 15, rest: 15 },
    { id: "aw_side_l",     name: "DB side bend (left)",       mode: "reps", value: 15, rest: 0  },
    { id: "aw_side_r",     name: "DB side bend (right)",      mode: "reps", value: 15, rest: 15 },
    { id: "aw_situp",      name: "Weighted sit-up",           mode: "reps", value: 12, rest: 15 },
    { id: "aw_pallof_l",   name: "Pallof press (left)",       mode: "reps", value: 12, rest: 0  },
    { id: "aw_pallof_r",   name: "Pallof press (right)",      mode: "reps", value: 12, rest: 15 },
    { id: "aw_drag",       name: "Plank plate drag",          mode: "reps", value: 10, rest: 0  },
  ],
};

// ─── CARDIO — additional ─────────────────────────────────────────

const CARDIO_TABATA: ExtraOption = {
  id: "cardio_tabata",
  name: "Tabata",
  description: "4 exercises × 4 rounds — 20s on, 10s off, no mercy",
  duration: "~8 min",
  category: "cardio",
  exercises: [
    // Round 1
    { id: "ctab_1_burp",  name: "Burpees",           mode: "time", value: 20, rest: 10 },
    { id: "ctab_1_squat", name: "Jump squats",        mode: "time", value: 20, rest: 10 },
    { id: "ctab_1_mc",    name: "Mountain climbers",  mode: "time", value: 20, rest: 10 },
    { id: "ctab_1_hk",    name: "High knees",         mode: "time", value: 20, rest: 10 },
    // Round 2
    { id: "ctab_2_burp",  name: "Burpees",            mode: "time", value: 20, rest: 10 },
    { id: "ctab_2_squat", name: "Jump squats",        mode: "time", value: 20, rest: 10 },
    { id: "ctab_2_mc",    name: "Mountain climbers",  mode: "time", value: 20, rest: 10 },
    { id: "ctab_2_hk",    name: "High knees",         mode: "time", value: 20, rest: 10 },
    // Round 3
    { id: "ctab_3_burp",  name: "Burpees",            mode: "time", value: 20, rest: 10 },
    { id: "ctab_3_squat", name: "Jump squats",        mode: "time", value: 20, rest: 10 },
    { id: "ctab_3_mc",    name: "Mountain climbers",  mode: "time", value: 20, rest: 10 },
    { id: "ctab_3_hk",    name: "High knees",         mode: "time", value: 20, rest: 10 },
    // Round 4
    { id: "ctab_4_burp",  name: "Burpees",            mode: "time", value: 20, rest: 10 },
    { id: "ctab_4_squat", name: "Jump squats",        mode: "time", value: 20, rest: 10 },
    { id: "ctab_4_mc",    name: "Mountain climbers",  mode: "time", value: 20, rest: 10 },
    { id: "ctab_4_hk",    name: "High knees",         mode: "time", value: 20, rest: 0  },
  ],
};

const CARDIO_TREADMILL: ExtraOption = {
  id: "cardio_treadmill",
  name: "Sprint Intervals",
  description: "Warm up, 4 hard sprints, cool down — treadmill or track",
  duration: "~10 min",
  category: "cardio",
  exercises: [
    { id: "ct_warmup",  name: "Jog (warm-up)",        mode: "time", value: 90, rest: 10 },
    { id: "ct_s1",      name: "Sprint",                mode: "time", value: 30, rest: 10 },
    { id: "ct_r1",      name: "Jog (recovery)",        mode: "time", value: 60, rest: 10 },
    { id: "ct_s2",      name: "Sprint",                mode: "time", value: 30, rest: 10 },
    { id: "ct_r2",      name: "Jog (recovery)",        mode: "time", value: 60, rest: 10 },
    { id: "ct_s3",      name: "Sprint",                mode: "time", value: 30, rest: 10 },
    { id: "ct_r3",      name: "Jog (recovery)",        mode: "time", value: 60, rest: 10 },
    { id: "ct_s4",      name: "Sprint",                mode: "time", value: 30, rest: 10 },
    { id: "ct_cooldown",name: "Jog (cool-down)",       mode: "time", value: 90, rest: 0  },
  ],
};

const CARDIO_ROW: ExtraOption = {
  id: "cardio_row",
  name: "Row & Recover",
  description: "4 hard rowing intervals with active recovery — works everything",
  duration: "~12 min",
  category: "cardio",
  exercises: [
    { id: "cr_easy",  name: "Row — easy warm-up",     mode: "time", value: 120, rest: 15 },
    { id: "cr_p1",    name: "Row sprint",              mode: "time", value: 60,  rest: 45 },
    { id: "cr_p2",    name: "Row sprint",              mode: "time", value: 60,  rest: 45 },
    { id: "cr_p3",    name: "Row sprint",              mode: "time", value: 60,  rest: 45 },
    { id: "cr_p4",    name: "Row sprint",              mode: "time", value: 60,  rest: 20 },
    { id: "cr_cool",  name: "Row — cool-down",         mode: "time", value: 120, rest: 0  },
  ],
};

// ─── STRETCH — additional ─────────────────────────────────────────

const STRETCH_HIPS: ExtraOption = {
  id: "stretch_hips",
  name: "Hip Opener",
  description: "Hip flexors, 90/90, pigeon — undo a week of sitting",
  duration: "~7 min",
  category: "stretch",
  exercises: [
    { id: "sh_hf_l",   name: "Hip flexor stretch (left)",   mode: "time", value: 45, rest: 0 },
    { id: "sh_hf_r",   name: "Hip flexor stretch (right)",  mode: "time", value: 45, rest: 0 },
    { id: "sh_9090_l", name: "90/90 stretch (left)",        mode: "time", value: 45, rest: 0 },
    { id: "sh_9090_r", name: "90/90 stretch (right)",       mode: "time", value: 45, rest: 0 },
    { id: "sh_frog",   name: "Frog stretch",                mode: "time", value: 60, rest: 0 },
    { id: "sh_pig_l",  name: "Pigeon stretch (left)",       mode: "time", value: 45, rest: 0 },
    { id: "sh_pig_r",  name: "Pigeon stretch (right)",      mode: "time", value: 45, rest: 0 },
    { id: "sh_baby",   name: "Happy baby",                  mode: "time", value: 30, rest: 0 },
  ],
};

const STRETCH_THORACIC: ExtraOption = {
  id: "stretch_thoracic",
  name: "T-Spine & Shoulders",
  description: "Upper back rotation, chest opening, shoulder unlock",
  duration: "~7 min",
  category: "stretch",
  exercises: [
    { id: "st_catcow",  name: "Cat-cow",                          mode: "time", value: 45, rest: 0 },
    { id: "st_ttn_l",   name: "Thread the needle (left)",         mode: "time", value: 35, rest: 0 },
    { id: "st_ttn_r",   name: "Thread the needle (right)",        mode: "time", value: 35, rest: 0 },
    { id: "st_rot_l",   name: "Thoracic rotation (left)",         mode: "time", value: 35, rest: 0 },
    { id: "st_rot_r",   name: "Thoracic rotation (right)",        mode: "time", value: 35, rest: 0 },
    { id: "st_door",    name: "Doorway chest stretch",            mode: "time", value: 40, rest: 0 },
    { id: "st_tri_l",   name: "Overhead tricep stretch (left)",   mode: "time", value: 30, rest: 0 },
    { id: "st_tri_r",   name: "Overhead tricep stretch (right)",  mode: "time", value: 30, rest: 0 },
    { id: "st_cb_l",    name: "Cross-body shoulder (left)",       mode: "time", value: 30, rest: 0 },
    { id: "st_cb_r",    name: "Cross-body shoulder (right)",      mode: "time", value: 30, rest: 0 },
  ],
};

const STRETCH_FLOW: ExtraOption = {
  id: "stretch_flow",
  name: "Full Body Flow",
  description: "Head to toe — foam roll, hips, hamstrings, spine, shoulders",
  duration: "~15 min",
  category: "stretch",
  exercises: [
    { id: "sf_foam_q",  name: "Foam roll quads",              mode: "time", value: 45, rest: 0 },
    { id: "sf_foam_it", name: "Foam roll IT band (each side)",mode: "time", value: 45, rest: 0 },
    { id: "sf_foam_lat",name: "Foam roll lats",               mode: "time", value: 30, rest: 0 },
    { id: "sf_catcow",  name: "Cat-cow",                      mode: "time", value: 45, rest: 0 },
    { id: "sf_dog",     name: "Downward dog",                 mode: "time", value: 45, rest: 0 },
    { id: "sf_lunge_l", name: "Low lunge (left)",             mode: "time", value: 45, rest: 0 },
    { id: "sf_lunge_r", name: "Low lunge (right)",            mode: "time", value: 45, rest: 0 },
    { id: "sf_pig_l",   name: "Pigeon stretch (left)",        mode: "time", value: 60, rest: 0 },
    { id: "sf_pig_r",   name: "Pigeon stretch (right)",       mode: "time", value: 60, rest: 0 },
    { id: "sf_hf_l",    name: "Hip flexor (left)",            mode: "time", value: 45, rest: 0 },
    { id: "sf_hf_r",    name: "Hip flexor (right)",           mode: "time", value: 45, rest: 0 },
    { id: "sf_ham",     name: "Seated forward fold",          mode: "time", value: 45, rest: 0 },
    { id: "sf_twist_l", name: "Supine spinal twist (left)",   mode: "time", value: 30, rest: 0 },
    { id: "sf_twist_r", name: "Supine spinal twist (right)",  mode: "time", value: 30, rest: 0 },
    { id: "sf_child",   name: "Child's pose",                 mode: "time", value: 45, rest: 0 },
  ],
};

// ─── Registry ────────────────────────────────────────────────────

export const EXTRAS: Record<string, ExtraOption> = {
  [ABS_QUICK.id]: ABS_QUICK,
  [ABS_CIRCUIT.id]: ABS_CIRCUIT,
  [ABS_BURNER.id]: ABS_BURNER,
  [ABS_LOWER.id]: ABS_LOWER,
  [ABS_OBLIQUE.id]: ABS_OBLIQUE,
  [ABS_WEIGHTED.id]: ABS_WEIGHTED,
  [CARDIO_QUICK.id]: CARDIO_QUICK,
  [CARDIO_HIIT.id]: CARDIO_HIIT,
  [CARDIO_CONDITIONING.id]: CARDIO_CONDITIONING,
  [CARDIO_TABATA.id]: CARDIO_TABATA,
  [CARDIO_TREADMILL.id]: CARDIO_TREADMILL,
  [CARDIO_ROW.id]: CARDIO_ROW,
  [STRETCH_QUICK.id]: STRETCH_QUICK,
  [STRETCH_COOLDOWN.id]: STRETCH_COOLDOWN,
  [STRETCH_MOBILITY.id]: STRETCH_MOBILITY,
  [STRETCH_HIPS.id]: STRETCH_HIPS,
  [STRETCH_THORACIC.id]: STRETCH_THORACIC,
  [STRETCH_FLOW.id]: STRETCH_FLOW,
};

export const EXTRAS_BY_CATEGORY: Record<ExtraCategory, ExtraOption[]> = {
  abs:     [ABS_QUICK, ABS_CIRCUIT, ABS_BURNER, ABS_LOWER, ABS_OBLIQUE, ABS_WEIGHTED],
  cardio:  [CARDIO_QUICK, CARDIO_HIIT, CARDIO_CONDITIONING, CARDIO_TABATA, CARDIO_TREADMILL, CARDIO_ROW],
  stretch: [STRETCH_QUICK, STRETCH_COOLDOWN, STRETCH_MOBILITY, STRETCH_HIPS, STRETCH_THORACIC, STRETCH_FLOW],
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
