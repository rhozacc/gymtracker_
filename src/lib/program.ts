export interface Exercise {
  id: string;
  name: string;
  sets: number;
  repRange: [number, number];
  increment: number;
  rest: number; // rest time in seconds between sets
}

export interface DayDefinition {
  label: string;
  exercises: Exercise[];
}

export type PlanCategory = "men" | "women" | "";
export type PlanGoal = "bulk" | "balanced" | "lean" | "";

export interface PlanDefinition {
  id: string;
  name: string;
  description: string;
  category: PlanCategory;
  goal: PlanGoal;
  days: Record<string, DayDefinition>;
}

export const PLANS: Record<string, PlanDefinition> = {
  // ─── MEN'S PLANS ───────────────────────────────────────────────

  upper_lower: {
    id: "upper_lower",
    name: "Upper / Lower",
    description: "3-day rotation: Upper A (strength), Lower A (strength), Upper B (hypertrophy)",
    category: "men",
    goal: "bulk",
    days: {
      upper_a: {
        label: "Day 1 — Upper A (strength)",
        exercises: [
          { id: "bench_press", name: "Bench press", sets: 4, repRange: [4, 6], increment: 2.5, rest: 120 },
          { id: "seated_db_press", name: "Seated DB press", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "weighted_dips", name: "Weighted dips", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "barbell_row", name: "Barbell row", sets: 4, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "pulldown", name: "Lat pulldown", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "face_pull", name: "Face pull", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
        ],
      },
      lower_a: {
        label: "Day 2 — Lower A (strength)",
        exercises: [
          { id: "squat", name: "Low bar squat", sets: 4, repRange: [4, 6], increment: 2.5, rest: 120 },
          { id: "rdl", name: "Romanian deadlift", sets: 3, repRange: [8, 10], increment: 5, rest: 75 },
          { id: "bulgarian_split_squat", name: "Bulgarian split squat", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "lying_curl", name: "Lying leg curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "leg_extension", name: "Leg extension", sets: 3, repRange: [12, 15], increment: 5, rest: 60 },
          { id: "calf_raise", name: "Calf raise (slow eccentric)", sets: 4, repRange: [8, 12], increment: 2.5, rest: 60 },
        ],
      },
      upper_b: {
        label: "Day 3 — Upper B (hypertrophy)",
        exercises: [
          { id: "incline_db_press", name: "Incline DB press", sets: 4, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "ohp", name: "Overhead press", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "pulldown", name: "Pulldown (close-grip)", sets: 4, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "fly_machine", name: "Chest fly machine", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "lateral_raise", name: "Lateral raise", sets: 4, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "biceps_curl", name: "Biceps curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "triceps", name: "Triceps pushdown", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
        ],
      },
    },
  },

  ppl: {
    id: "ppl",
    name: "Push / Pull / Legs",
    description: "3-day split targeting push, pull, and leg movements",
    category: "men",
    goal: "bulk",
    days: {
      push: {
        label: "Day 1 — Push",
        exercises: [
          { id: "bench_press", name: "Bench press", sets: 4, repRange: [4, 6], increment: 2.5, rest: 120 },
          { id: "ohp", name: "Overhead press", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "incline_db_press", name: "Incline DB press", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "cable_fly", name: "Cable fly", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "lateral_raise", name: "Lateral raise", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "triceps_pushdown", name: "Triceps pushdown", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "overhead_extension", name: "Overhead triceps extension", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
        ],
      },
      pull: {
        label: "Day 2 — Pull",
        exercises: [
          { id: "barbell_row", name: "Barbell row", sets: 4, repRange: [4, 6], increment: 2.5, rest: 120 },
          { id: "weighted_pullup", name: "Weighted pull-up", sets: 3, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "cable_row", name: "Cable row", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "rear_delt_fly", name: "Rear delt fly", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
          { id: "face_pull", name: "Face pull", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
          { id: "barbell_curl", name: "Barbell curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "hammer_curl", name: "Hammer curl", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
        ],
      },
      legs: {
        label: "Day 3 — Legs",
        exercises: [
          { id: "squat", name: "Squat", sets: 4, repRange: [4, 6], increment: 2.5, rest: 120 },
          { id: "rdl", name: "Romanian deadlift", sets: 3, repRange: [8, 10], increment: 5, rest: 75 },
          { id: "leg_press", name: "Leg press", sets: 3, repRange: [10, 12], increment: 5, rest: 60 },
          { id: "walking_lunge", name: "Walking lunge", sets: 3, repRange: [10, 12], increment: 5, rest: 60 },
          { id: "leg_curl", name: "Leg curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "leg_extension", name: "Leg extension", sets: 3, repRange: [12, 15], increment: 5, rest: 60 },
          { id: "calf_raise", name: "Calf raise", sets: 4, repRange: [10, 12], increment: 2.5, rest: 60 },
        ],
      },
    },
  },

  gym_bro: {
    id: "gym_bro",
    name: "Gym Bro",
    description: "5-day classic bodybuilding split",
    category: "men",
    goal: "balanced",
    days: {
      chest: {
        label: "Day 1 — Chest",
        exercises: [
          { id: "bench_press", name: "Bench press", sets: 4, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "incline_db_press", name: "Incline DB press", sets: 4, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "cable_fly", name: "Cable fly", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "dips", name: "Dips", sets: 3, repRange: [8, 12], increment: 2.5, rest: 75 },
          { id: "pec_deck", name: "Pec deck", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
        ],
      },
      back: {
        label: "Day 2 — Back",
        exercises: [
          { id: "deadlift", name: "Deadlift", sets: 4, repRange: [4, 6], increment: 5, rest: 120 },
          { id: "barbell_row", name: "Barbell row", sets: 4, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "weighted_pullup", name: "Weighted pull-up", sets: 3, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "cable_row", name: "Cable row", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "straight_arm_pulldown", name: "Straight-arm pulldown", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "face_pull", name: "Face pull", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
        ],
      },
      shoulders: {
        label: "Day 3 — Shoulders",
        exercises: [
          { id: "ohp", name: "Overhead press", sets: 4, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "lateral_raise", name: "Lateral raise", sets: 4, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "cable_lateral_raise", name: "Cable lateral raise", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "rear_delt_fly", name: "Rear delt fly", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
          { id: "face_pull", name: "Face pull", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
          { id: "shrugs", name: "Shrugs", sets: 3, repRange: [10, 12], increment: 5, rest: 60 },
        ],
      },
      arms: {
        label: "Day 4 — Arms",
        exercises: [
          { id: "barbell_curl", name: "Barbell curl", sets: 4, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "close_grip_bench", name: "Close-grip bench press", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "hammer_curl", name: "Hammer curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "triceps_pushdown", name: "Triceps pushdown", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "preacher_curl", name: "Preacher curl", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "overhead_extension", name: "Overhead extension", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
        ],
      },
      legs_bro: {
        label: "Day 5 — Legs",
        exercises: [
          { id: "squat", name: "Squat", sets: 4, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "leg_press", name: "Leg press", sets: 4, repRange: [10, 12], increment: 5, rest: 60 },
          { id: "rdl", name: "Romanian deadlift", sets: 3, repRange: [8, 10], increment: 5, rest: 75 },
          { id: "leg_extension", name: "Leg extension", sets: 3, repRange: [12, 15], increment: 5, rest: 60 },
          { id: "leg_curl", name: "Leg curl", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "calf_raise", name: "Calf raise", sets: 4, repRange: [10, 12], increment: 2.5, rest: 60 },
        ],
      },
    },
  },

  arnold: {
    id: "arnold",
    name: "Arnold Split",
    description: "3-day antagonist pairing split",
    category: "men",
    goal: "balanced",
    days: {
      chest_back: {
        label: "Day 1 — Chest & Back",
        exercises: [
          { id: "bench_press", name: "Bench press", sets: 4, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "barbell_row", name: "Barbell row", sets: 4, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "incline_db_press", name: "Incline DB press", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "weighted_pullup", name: "Weighted pull-up", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "cable_fly", name: "Cable fly", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "cable_row", name: "Cable row", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
        ],
      },
      shoulders_arms: {
        label: "Day 2 — Shoulders & Arms",
        exercises: [
          { id: "ohp", name: "Overhead press", sets: 4, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "lateral_raise", name: "Lateral raise", sets: 4, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "rear_delt_fly", name: "Rear delt fly", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
          { id: "barbell_curl", name: "Barbell curl", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "triceps_pushdown", name: "Triceps pushdown", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "hammer_curl", name: "Hammer curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "overhead_extension", name: "Overhead extension", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
        ],
      },
      legs_arnold: {
        label: "Day 3 — Legs",
        exercises: [
          { id: "squat", name: "Squat", sets: 4, repRange: [4, 6], increment: 2.5, rest: 120 },
          { id: "rdl", name: "Romanian deadlift", sets: 3, repRange: [8, 10], increment: 5, rest: 75 },
          { id: "leg_press", name: "Leg press", sets: 3, repRange: [10, 12], increment: 5, rest: 60 },
          { id: "leg_curl", name: "Leg curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "leg_extension", name: "Leg extension", sets: 3, repRange: [12, 15], increment: 5, rest: 60 },
          { id: "calf_raise", name: "Calf raise", sets: 4, repRange: [10, 12], increment: 2.5, rest: 60 },
        ],
      },
    },
  },
  mens_lean_cut: {
    id: "mens_lean_cut",
    name: "Lean Cut",
    description: "3-day high-rep metabolic split with shorter rest — built for cutting phases",
    category: "men",
    goal: "lean",
    days: {
      lean_upper: {
        label: "Day 1 — Upper (Metabolic)",
        exercises: [
          { id: "lc_incline_db_press", name: "Incline DB press", sets: 4, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "lc_cable_row", name: "Cable row", sets: 4, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "lc_db_shoulder_press", name: "DB shoulder press", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "lc_lat_pulldown", name: "Lat pulldown", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "lc_cable_fly", name: "Cable fly", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lc_face_pull", name: "Face pull", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lc_bicep_curl", name: "Biceps curl", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lc_tricep_pushdown", name: "Triceps pushdown", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
        ],
      },
      lean_lower: {
        label: "Day 2 — Lower (Metabolic)",
        exercises: [
          { id: "lc_goblet_squat", name: "Goblet squat", sets: 4, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "lc_rdl", name: "Romanian deadlift", sets: 4, repRange: [12, 15], increment: 5, rest: 45 },
          { id: "lc_walking_lunge", name: "Walking lunge", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "lc_leg_press", name: "Leg press", sets: 3, repRange: [15, 20], increment: 5, rest: 45 },
          { id: "lc_leg_curl", name: "Leg curl", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lc_leg_extension", name: "Leg extension", sets: 3, repRange: [15, 20], increment: 5, rest: 30 },
          { id: "lc_calf_raise", name: "Calf raise", sets: 4, repRange: [15, 20], increment: 2.5, rest: 30 },
        ],
      },
      lean_full: {
        label: "Day 3 — Full Body (Circuit)",
        exercises: [
          { id: "lc_trap_bar_dl", name: "Trap bar deadlift", sets: 3, repRange: [10, 12], increment: 5, rest: 60 },
          { id: "lc_db_bench", name: "DB bench press", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "lc_pullup", name: "Pull-up (bodyweight)", sets: 3, repRange: [8, 12], increment: 0, rest: 45 },
          { id: "lc_db_lunge", name: "DB reverse lunge", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "lc_lateral_raise", name: "Lateral raise", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lc_plank_row", name: "Renegade row", sets: 3, repRange: [10, 12], increment: 2.5, rest: 30 },
        ],
      },
    },
  },

  mens_strength: {
    id: "mens_strength",
    name: "Strength Foundation",
    description: "4-day powerbuilding program — heavy compounds with accessory work",
    category: "men",
    goal: "bulk",
    days: {
      str_squat: {
        label: "Day 1 — Squat Focus",
        exercises: [
          { id: "str_squat", name: "Back squat", sets: 5, repRange: [3, 5], increment: 2.5, rest: 180 },
          { id: "str_front_squat", name: "Front squat", sets: 3, repRange: [6, 8], increment: 2.5, rest: 120 },
          { id: "str_leg_press", name: "Leg press", sets: 3, repRange: [8, 10], increment: 5, rest: 90 },
          { id: "str_leg_curl", name: "Leg curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "str_calf_raise", name: "Calf raise", sets: 4, repRange: [10, 12], increment: 2.5, rest: 60 },
        ],
      },
      str_bench: {
        label: "Day 2 — Bench Focus",
        exercises: [
          { id: "str_bench", name: "Bench press", sets: 5, repRange: [3, 5], increment: 2.5, rest: 180 },
          { id: "str_close_grip_bench", name: "Close-grip bench", sets: 3, repRange: [6, 8], increment: 2.5, rest: 120 },
          { id: "str_db_ohp", name: "DB overhead press", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "str_dips", name: "Weighted dips", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "str_lateral_raise", name: "Lateral raise", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
        ],
      },
      str_deadlift: {
        label: "Day 3 — Deadlift Focus",
        exercises: [
          { id: "str_deadlift", name: "Conventional deadlift", sets: 5, repRange: [3, 5], increment: 5, rest: 180 },
          { id: "str_rdl", name: "Romanian deadlift", sets: 3, repRange: [8, 10], increment: 5, rest: 90 },
          { id: "str_barbell_row", name: "Barbell row", sets: 4, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "str_pullup", name: "Weighted pull-up", sets: 3, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "str_face_pull", name: "Face pull", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
        ],
      },
      str_ohp: {
        label: "Day 4 — OHP Focus",
        exercises: [
          { id: "str_ohp", name: "Overhead press", sets: 5, repRange: [3, 5], increment: 2.5, rest: 180 },
          { id: "str_push_press", name: "Push press", sets: 3, repRange: [6, 8], increment: 2.5, rest: 120 },
          { id: "str_incline_bench", name: "Incline bench press", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "str_barbell_curl", name: "Barbell curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "str_tricep_ext", name: "Overhead extension", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
        ],
      },
    },
  },

  // ─── WOMEN'S PLANS ─────────────────────────────────────────────

  womens_sculpt: {
    id: "womens_sculpt",
    name: "Sculpt",
    description: "3-day high-rep toning split — glute and core emphasis with shorter rest",
    category: "women",
    goal: "lean",
    days: {
      sculpt_lower: {
        label: "Day 1 — Lower Body (Glute Focus)",
        exercises: [
          { id: "ws_hip_thrust", name: "Hip thrust", sets: 4, repRange: [12, 15], increment: 5, rest: 60 },
          { id: "ws_sumo_squat", name: "Sumo squat", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "ws_rdl", name: "Romanian deadlift", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "ws_cable_kickback", name: "Cable kickback", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "ws_leg_curl", name: "Lying leg curl", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "ws_calf_raise", name: "Calf raise", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
        ],
      },
      sculpt_upper: {
        label: "Day 2 — Upper Body (Tone)",
        exercises: [
          { id: "ws_db_bench", name: "DB bench press", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "ws_lat_pulldown", name: "Lat pulldown", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "ws_db_shoulder_press", name: "DB shoulder press", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "ws_cable_row", name: "Seated cable row", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "ws_lateral_raise", name: "Lateral raise", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "ws_tricep_pushdown", name: "Triceps pushdown", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "ws_bicep_curl", name: "Biceps curl", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
        ],
      },
      sculpt_full: {
        label: "Day 3 — Full Body (Core & Glutes)",
        exercises: [
          { id: "ws_goblet_squat", name: "Goblet squat", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "ws_hip_thrust_b", name: "Single-leg hip thrust", sets: 3, repRange: [12, 15], increment: 0, rest: 45 },
          { id: "ws_db_row", name: "Single-arm DB row", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "ws_push_up", name: "Push-up", sets: 3, repRange: [10, 15], increment: 0, rest: 30 },
          { id: "ws_cable_pull_through", name: "Cable pull-through", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "ws_plank_hold", name: "Plank hold (seconds)", sets: 3, repRange: [30, 60], increment: 0, rest: 30 },
        ],
      },
    },
  },

  womens_strong_curves: {
    id: "womens_strong_curves",
    name: "Strong Curves",
    description: "4-day balanced split — build strength with posterior chain and shoulder focus",
    category: "women",
    goal: "balanced",
    days: {
      sc_glutes_hams: {
        label: "Day 1 — Glutes & Hamstrings",
        exercises: [
          { id: "sc_hip_thrust", name: "Barbell hip thrust", sets: 4, repRange: [8, 12], increment: 5, rest: 75 },
          { id: "sc_rdl", name: "Romanian deadlift", sets: 4, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "sc_bulgarian", name: "Bulgarian split squat", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "sc_leg_curl", name: "Seated leg curl", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "sc_cable_kickback", name: "Cable kickback", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "sc_back_extension", name: "Back extension (glute)", sets: 3, repRange: [12, 15], increment: 5, rest: 45 },
        ],
      },
      sc_upper: {
        label: "Day 2 — Upper Body",
        exercises: [
          { id: "sc_db_bench", name: "DB bench press", sets: 4, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "sc_lat_pulldown", name: "Lat pulldown", sets: 4, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "sc_db_ohp", name: "DB overhead press", sets: 3, repRange: [8, 10], increment: 2.5, rest: 60 },
          { id: "sc_cable_row", name: "Cable row", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "sc_lateral_raise", name: "Lateral raise", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "sc_face_pull", name: "Face pull", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
          { id: "sc_bicep_curl", name: "Biceps curl", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
        ],
      },
      sc_quads: {
        label: "Day 3 — Quads & Calves",
        exercises: [
          { id: "sc_squat", name: "Barbell squat", sets: 4, repRange: [8, 10], increment: 2.5, rest: 90 },
          { id: "sc_leg_press", name: "Leg press", sets: 3, repRange: [10, 12], increment: 5, rest: 75 },
          { id: "sc_step_up", name: "Step-up", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "sc_leg_extension", name: "Leg extension", sets: 3, repRange: [12, 15], increment: 5, rest: 60 },
          { id: "sc_calf_raise", name: "Calf raise", sets: 4, repRange: [12, 15], increment: 2.5, rest: 45 },
        ],
      },
      sc_full: {
        label: "Day 4 — Full Body (Pump)",
        exercises: [
          { id: "sc_sumo_dl", name: "Sumo deadlift", sets: 3, repRange: [8, 10], increment: 5, rest: 75 },
          { id: "sc_incline_db_press", name: "Incline DB press", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "sc_hip_thrust_b", name: "Hip thrust (pause rep)", sets: 3, repRange: [10, 12], increment: 5, rest: 60 },
          { id: "sc_pullup", name: "Assisted pull-up", sets: 3, repRange: [8, 10], increment: 0, rest: 60 },
          { id: "sc_reverse_lunge", name: "Reverse lunge", sets: 3, repRange: [10, 12], increment: 2.5, rest: 45 },
          { id: "sc_rear_delt_fly", name: "Rear delt fly", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
        ],
      },
    },
  },

  womens_power_build: {
    id: "womens_power_build",
    name: "Power Build",
    description: "4-day progressive overload program — compound-heavy for strength and size gains",
    category: "women",
    goal: "bulk",
    days: {
      pb_lower_a: {
        label: "Day 1 — Lower (Strength)",
        exercises: [
          { id: "pb_squat", name: "Barbell squat", sets: 4, repRange: [4, 6], increment: 2.5, rest: 120 },
          { id: "pb_hip_thrust", name: "Barbell hip thrust", sets: 4, repRange: [6, 8], increment: 5, rest: 90 },
          { id: "pb_rdl", name: "Romanian deadlift", sets: 3, repRange: [6, 8], increment: 5, rest: 90 },
          { id: "pb_leg_press", name: "Leg press", sets: 3, repRange: [8, 10], increment: 5, rest: 75 },
          { id: "pb_leg_curl", name: "Leg curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "pb_calf_raise", name: "Calf raise", sets: 4, repRange: [8, 12], increment: 2.5, rest: 60 },
        ],
      },
      pb_upper_a: {
        label: "Day 2 — Upper (Strength)",
        exercises: [
          { id: "pb_bench", name: "Bench press", sets: 4, repRange: [4, 6], increment: 2.5, rest: 120 },
          { id: "pb_barbell_row", name: "Barbell row", sets: 4, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "pb_ohp", name: "Overhead press", sets: 3, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "pb_lat_pulldown", name: "Lat pulldown", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "pb_lateral_raise", name: "Lateral raise", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "pb_bicep_curl", name: "Biceps curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
        ],
      },
      pb_lower_b: {
        label: "Day 3 — Lower (Hypertrophy)",
        exercises: [
          { id: "pb_sumo_squat", name: "Sumo squat", sets: 4, repRange: [10, 12], increment: 2.5, rest: 75 },
          { id: "pb_hip_thrust_b", name: "Hip thrust (single-leg)", sets: 3, repRange: [10, 12], increment: 0, rest: 60 },
          { id: "pb_bulgarian", name: "Bulgarian split squat", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "pb_cable_kickback", name: "Cable kickback", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "pb_leg_extension", name: "Leg extension", sets: 3, repRange: [12, 15], increment: 5, rest: 60 },
          { id: "pb_lying_curl", name: "Lying leg curl", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
        ],
      },
      pb_upper_b: {
        label: "Day 4 — Upper (Hypertrophy)",
        exercises: [
          { id: "pb_incline_db", name: "Incline DB press", sets: 4, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "pb_cable_row", name: "Cable row", sets: 4, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "pb_db_ohp", name: "DB shoulder press", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "pb_chest_fly", name: "Chest fly", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "pb_face_pull", name: "Face pull", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
          { id: "pb_tricep_pushdown", name: "Triceps pushdown", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "pb_hammer_curl", name: "Hammer curl", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
        ],
      },
    },
  },

  womens_lean_tone: {
    id: "womens_lean_tone",
    name: "Lean & Tone",
    description: "3-day full body circuit-style — higher reps, minimal rest, maximum burn",
    category: "women",
    goal: "lean",
    days: {
      lt_day_a: {
        label: "Day 1 — Full Body A",
        exercises: [
          { id: "lt_goblet_squat", name: "Goblet squat", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lt_hip_thrust", name: "Hip thrust", sets: 3, repRange: [15, 20], increment: 5, rest: 30 },
          { id: "lt_db_press", name: "DB bench press", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lt_cable_row", name: "Cable row", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lt_lateral_raise", name: "Lateral raise", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lt_mountain_climber", name: "Mountain climbers (reps)", sets: 3, repRange: [20, 30], increment: 0, rest: 20 },
        ],
      },
      lt_day_b: {
        label: "Day 2 — Full Body B",
        exercises: [
          { id: "lt_sumo_dl", name: "Sumo deadlift", sets: 3, repRange: [12, 15], increment: 5, rest: 45 },
          { id: "lt_step_up", name: "Step-up", sets: 3, repRange: [12, 15], increment: 2.5, rest: 30 },
          { id: "lt_lat_pulldown", name: "Lat pulldown", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lt_push_up", name: "Push-up", sets: 3, repRange: [10, 15], increment: 0, rest: 30 },
          { id: "lt_cable_kickback", name: "Cable kickback", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lt_plank", name: "Plank hold (seconds)", sets: 3, repRange: [30, 60], increment: 0, rest: 20 },
        ],
      },
      lt_day_c: {
        label: "Day 3 — Full Body C (Burnout)",
        exercises: [
          { id: "lt_walking_lunge", name: "Walking lunge", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lt_hip_thrust_b", name: "Hip thrust (pause rep)", sets: 3, repRange: [15, 20], increment: 5, rest: 30 },
          { id: "lt_db_row", name: "Single-arm DB row", sets: 3, repRange: [12, 15], increment: 2.5, rest: 30 },
          { id: "lt_incline_fly", name: "Incline DB fly", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lt_rear_delt", name: "Rear delt fly", sets: 3, repRange: [15, 20], increment: 2.5, rest: 30 },
          { id: "lt_bicycle_crunch", name: "Bicycle crunches (reps)", sets: 3, repRange: [20, 30], increment: 0, rest: 20 },
        ],
      },
    },
  },

  womens_upper_lower: {
    id: "womens_upper_lower",
    name: "Upper / Lower",
    description: "3-day balanced rotation — moderate volume with progressive overload",
    category: "women",
    goal: "balanced",
    days: {
      wul_lower_a: {
        label: "Day 1 — Lower A (Glutes & Hams)",
        exercises: [
          { id: "wul_hip_thrust", name: "Barbell hip thrust", sets: 4, repRange: [8, 12], increment: 5, rest: 75 },
          { id: "wul_rdl", name: "Romanian deadlift", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "wul_bulgarian", name: "Bulgarian split squat", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "wul_leg_curl", name: "Lying leg curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "wul_cable_kickback", name: "Cable kickback", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "wul_calf_raise", name: "Calf raise", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
        ],
      },
      wul_upper: {
        label: "Day 2 — Upper Body",
        exercises: [
          { id: "wul_db_bench", name: "DB bench press", sets: 4, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "wul_lat_pulldown", name: "Lat pulldown", sets: 4, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "wul_db_ohp", name: "DB shoulder press", sets: 3, repRange: [8, 10], increment: 2.5, rest: 60 },
          { id: "wul_cable_row", name: "Cable row", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "wul_chest_fly", name: "Chest fly", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "wul_lateral_raise", name: "Lateral raise", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "wul_face_pull", name: "Face pull", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
        ],
      },
      wul_lower_b: {
        label: "Day 3 — Lower B (Quads & Glutes)",
        exercises: [
          { id: "wul_squat", name: "Barbell squat", sets: 4, repRange: [8, 10], increment: 2.5, rest: 90 },
          { id: "wul_leg_press", name: "Leg press", sets: 3, repRange: [10, 12], increment: 5, rest: 75 },
          { id: "wul_hip_thrust_b", name: "Hip thrust (pause rep)", sets: 3, repRange: [10, 12], increment: 5, rest: 60 },
          { id: "wul_step_up", name: "Step-up", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "wul_leg_extension", name: "Leg extension", sets: 3, repRange: [12, 15], increment: 5, rest: 60 },
          { id: "wul_back_extension", name: "Back extension", sets: 3, repRange: [12, 15], increment: 5, rest: 45 },
        ],
      },
    },
  },

  womens_ppl: {
    id: "womens_ppl",
    name: "Push / Pull / Legs",
    description: "3-day compound-heavy split — structured for progressive overload and building",
    category: "women",
    goal: "bulk",
    days: {
      wppl_push: {
        label: "Day 1 — Push",
        exercises: [
          { id: "wppl_bench", name: "Bench press", sets: 4, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "wppl_db_ohp", name: "DB shoulder press", sets: 3, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "wppl_incline_db", name: "Incline DB press", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "wppl_cable_fly", name: "Cable fly", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "wppl_lateral_raise", name: "Lateral raise", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
          { id: "wppl_tricep_pushdown", name: "Triceps pushdown", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
        ],
      },
      wppl_pull: {
        label: "Day 2 — Pull",
        exercises: [
          { id: "wppl_barbell_row", name: "Barbell row", sets: 4, repRange: [6, 8], increment: 2.5, rest: 90 },
          { id: "wppl_lat_pulldown", name: "Lat pulldown", sets: 4, repRange: [8, 10], increment: 2.5, rest: 75 },
          { id: "wppl_cable_row", name: "Seated cable row", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "wppl_face_pull", name: "Face pull", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
          { id: "wppl_rear_delt", name: "Rear delt fly", sets: 3, repRange: [15, 20], increment: 2.5, rest: 45 },
          { id: "wppl_bicep_curl", name: "Biceps curl", sets: 3, repRange: [10, 12], increment: 2.5, rest: 45 },
          { id: "wppl_hammer_curl", name: "Hammer curl", sets: 3, repRange: [12, 15], increment: 2.5, rest: 45 },
        ],
      },
      wppl_legs: {
        label: "Day 3 — Legs",
        exercises: [
          { id: "wppl_squat", name: "Barbell squat", sets: 4, repRange: [6, 8], increment: 2.5, rest: 120 },
          { id: "wppl_hip_thrust", name: "Barbell hip thrust", sets: 4, repRange: [8, 10], increment: 5, rest: 75 },
          { id: "wppl_rdl", name: "Romanian deadlift", sets: 3, repRange: [8, 10], increment: 5, rest: 75 },
          { id: "wppl_bulgarian", name: "Bulgarian split squat", sets: 3, repRange: [10, 12], increment: 2.5, rest: 60 },
          { id: "wppl_leg_curl", name: "Leg curl", sets: 3, repRange: [12, 15], increment: 2.5, rest: 60 },
          { id: "wppl_leg_extension", name: "Leg extension", sets: 3, repRange: [12, 15], increment: 5, rest: 60 },
          { id: "wppl_calf_raise", name: "Calf raise", sets: 4, repRange: [10, 12], increment: 2.5, rest: 45 },
        ],
      },
    },
  },
};

export const PLAN_IDS = Object.keys(PLANS);

// Backward-compatible alias — points to the default plan's days
export const PROGRAM = PLANS.upper_lower.days;
export const DAY_TYPES = Object.keys(PROGRAM) as Array<keyof typeof PROGRAM>;

// Runtime plan registry — populated from DB on client, falls back to built-in PLANS
let _dbPlans: Record<string, PlanDefinition> | null = null;

export function registerPlans(plans: Record<string, PlanDefinition>) {
  _dbPlans = plans;
}

export function allPlans(): Record<string, PlanDefinition> {
  return _dbPlans ?? PLANS;
}

// Search ALL plans (built-in + custom) for an exercise by ID
export function getExerciseById(id: string): Exercise | undefined {
  for (const plan of Object.values(allPlans())) {
    for (const day of Object.values(plan.days)) {
      const ex = day.exercises.find((e) => e.id === id);
      if (ex) return ex;
    }
  }
  return undefined;
}

// Get all exercises across all plans, deduplicated by ID
export function getAllExercises(): Exercise[] {
  const seen = new Set<string>();
  const exercises: Exercise[] = [];
  for (const plan of Object.values(allPlans())) {
    for (const day of Object.values(plan.days)) {
      for (const ex of day.exercises) {
        if (!seen.has(ex.id)) {
          seen.add(ex.id);
          exercises.push(ex);
        }
      }
    }
  }
  return exercises;
}

// Get all exercises for a specific plan
export function getAllExercisesForPlan(planId: string): Exercise[] {
  const plan = allPlans()[planId];
  if (!plan) return [];
  const exercises: Exercise[] = [];
  for (const day of Object.values(plan.days)) {
    exercises.push(...day.exercises);
  }
  return exercises;
}

// Get a day label by searching all plans
export function getDayLabel(dayType: string): string {
  for (const plan of Object.values(allPlans())) {
    if (plan.days[dayType]) return plan.days[dayType].label;
  }
  return dayType;
}

// Get short label for chart legends (strips "Day N — " prefix)
export function getDayShortLabel(dayType: string): string {
  const label = getDayLabel(dayType);
  const dashIdx = label.indexOf("—");
  return dashIdx >= 0 ? label.slice(dashIdx + 2).trim() : label;
}

// Get a DayDefinition by searching all plans
export function getDayDefinition(dayType: string): DayDefinition | undefined {
  for (const plan of Object.values(allPlans())) {
    if (plan.days[dayType]) return plan.days[dayType];
  }
  return undefined;
}
