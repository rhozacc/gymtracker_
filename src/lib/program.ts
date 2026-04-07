export interface Exercise {
  id: string;
  name: string;
  sets: number;
  repRange: [number, number];
  increment: number;
}

export interface DayDefinition {
  label: string;
  exercises: Exercise[];
}

export interface PlanDefinition {
  id: string;
  name: string;
  description: string;
  days: Record<string, DayDefinition>;
}

export const PLANS: Record<string, PlanDefinition> = {
  upper_lower: {
    id: "upper_lower",
    name: "Upper / Lower",
    description: "3-day split: upper strength, lower strength, full body hypertrophy",
    days: {
      upper_a: {
        label: "Day 1 — Upper (strength)",
        exercises: [
          { id: "bench_ohp", name: "Bench / OHP", sets: 4, repRange: [4, 6], increment: 2.5 },
          { id: "behind_neck_press", name: "Behind neck press", sets: 3, repRange: [8, 10], increment: 2.5 },
          { id: "weighted_dips", name: "Weighted dips", sets: 3, repRange: [8, 10], increment: 2.5 },
          { id: "one_arm_row", name: "One-arm row machine", sets: 4, repRange: [8, 10], increment: 5 },
          { id: "face_pull", name: "Face pull / rear delt", sets: 3, repRange: [15, 20], increment: 2.5 },
        ],
      },
      lower: {
        label: "Day 2 — Lower (strength)",
        exercises: [
          { id: "squat", name: "Low bar squat / front squat", sets: 4, repRange: [4, 6], increment: 2.5 },
          { id: "rdl", name: "Romanian deadlift", sets: 3, repRange: [8, 10], increment: 5 },
          { id: "single_leg_press", name: "Single leg press", sets: 3, repRange: [10, 12], increment: 5 },
          { id: "lying_curl", name: "Lying leg curl", sets: 3, repRange: [10, 12], increment: 2.5 },
          { id: "calf_raise", name: "Calf raise (slow negative)", sets: 4, repRange: [8, 10], increment: 2.5 },
        ],
      },
      full: {
        label: "Day 3 — Full body (hypertrophy)",
        exercises: [
          { id: "pulldown", name: "Pulldown (1-arm / bilateral)", sets: 4, repRange: [10, 12], increment: 2.5 },
          { id: "fly_machine", name: "Chest fly machine", sets: 4, repRange: [12, 15], increment: 2.5 },
          { id: "leg_extension", name: "Leg extension", sets: 3, repRange: [12, 15], increment: 5 },
          { id: "biceps_curl", name: "Biceps curl", sets: 4, repRange: [12, 15], increment: 2.5 },
          { id: "triceps", name: "Triceps pushdown / overhead", sets: 4, repRange: [12, 15], increment: 2.5 },
          { id: "rear_delt", name: "Swing-up / rear delt machine", sets: 3, repRange: [12, 15], increment: 2.5 },
        ],
      },
    },
  },

  ppl: {
    id: "ppl",
    name: "Push / Pull / Legs",
    description: "3-day split targeting push, pull, and leg movements",
    days: {
      push: {
        label: "Day 1 — Push",
        exercises: [
          { id: "bench_press", name: "Bench press", sets: 4, repRange: [4, 6], increment: 2.5 },
          { id: "ohp", name: "Overhead press", sets: 3, repRange: [8, 10], increment: 2.5 },
          { id: "incline_db_press", name: "Incline DB press", sets: 3, repRange: [10, 12], increment: 2.5 },
          { id: "lateral_raise", name: "Lateral raise", sets: 3, repRange: [12, 15], increment: 2.5 },
          { id: "triceps_pushdown", name: "Triceps pushdown", sets: 3, repRange: [12, 15], increment: 2.5 },
          { id: "overhead_extension", name: "Overhead triceps extension", sets: 3, repRange: [12, 15], increment: 2.5 },
        ],
      },
      pull: {
        label: "Day 2 — Pull",
        exercises: [
          { id: "barbell_row", name: "Barbell row", sets: 4, repRange: [4, 6], increment: 2.5 },
          { id: "weighted_pullup", name: "Weighted pull-up", sets: 3, repRange: [6, 8], increment: 2.5 },
          { id: "cable_row", name: "Cable row", sets: 3, repRange: [10, 12], increment: 2.5 },
          { id: "face_pull", name: "Face pull", sets: 3, repRange: [15, 20], increment: 2.5 },
          { id: "barbell_curl", name: "Barbell curl", sets: 3, repRange: [10, 12], increment: 2.5 },
          { id: "hammer_curl", name: "Hammer curl", sets: 3, repRange: [12, 15], increment: 2.5 },
        ],
      },
      legs: {
        label: "Day 3 — Legs",
        exercises: [
          { id: "squat", name: "Squat", sets: 4, repRange: [4, 6], increment: 2.5 },
          { id: "rdl", name: "Romanian deadlift", sets: 3, repRange: [8, 10], increment: 5 },
          { id: "leg_press", name: "Leg press", sets: 3, repRange: [10, 12], increment: 5 },
          { id: "leg_curl", name: "Leg curl", sets: 3, repRange: [10, 12], increment: 2.5 },
          { id: "leg_extension", name: "Leg extension", sets: 3, repRange: [12, 15], increment: 5 },
          { id: "calf_raise", name: "Calf raise", sets: 4, repRange: [10, 12], increment: 2.5 },
        ],
      },
    },
  },

  gym_bro: {
    id: "gym_bro",
    name: "Gym Bro",
    description: "5-day classic bodybuilding split",
    days: {
      chest: {
        label: "Day 1 — Chest",
        exercises: [
          { id: "bench_press", name: "Bench press", sets: 4, repRange: [6, 8], increment: 2.5 },
          { id: "incline_db_press", name: "Incline DB press", sets: 3, repRange: [8, 10], increment: 2.5 },
          { id: "cable_fly", name: "Cable fly", sets: 3, repRange: [12, 15], increment: 2.5 },
          { id: "dips", name: "Dips", sets: 3, repRange: [8, 12], increment: 2.5 },
          { id: "pec_deck", name: "Pec deck", sets: 3, repRange: [12, 15], increment: 2.5 },
        ],
      },
      back: {
        label: "Day 2 — Back",
        exercises: [
          { id: "deadlift", name: "Deadlift", sets: 4, repRange: [4, 6], increment: 5 },
          { id: "barbell_row", name: "Barbell row", sets: 4, repRange: [8, 10], increment: 2.5 },
          { id: "pulldown", name: "Lat pulldown", sets: 3, repRange: [10, 12], increment: 2.5 },
          { id: "cable_row", name: "Cable row", sets: 3, repRange: [10, 12], increment: 2.5 },
          { id: "face_pull", name: "Face pull", sets: 3, repRange: [15, 20], increment: 2.5 },
        ],
      },
      shoulders: {
        label: "Day 3 — Shoulders",
        exercises: [
          { id: "ohp", name: "Overhead press", sets: 4, repRange: [6, 8], increment: 2.5 },
          { id: "lateral_raise", name: "Lateral raise", sets: 4, repRange: [12, 15], increment: 2.5 },
          { id: "rear_delt_fly", name: "Rear delt fly", sets: 3, repRange: [15, 20], increment: 2.5 },
          { id: "upright_row", name: "Upright row", sets: 3, repRange: [10, 12], increment: 2.5 },
          { id: "shrugs", name: "Shrugs", sets: 3, repRange: [10, 12], increment: 5 },
        ],
      },
      arms: {
        label: "Day 4 — Arms",
        exercises: [
          { id: "barbell_curl", name: "Barbell curl", sets: 4, repRange: [8, 10], increment: 2.5 },
          { id: "hammer_curl", name: "Hammer curl", sets: 3, repRange: [10, 12], increment: 2.5 },
          { id: "preacher_curl", name: "Preacher curl", sets: 3, repRange: [12, 15], increment: 2.5 },
          { id: "close_grip_bench", name: "Close-grip bench press", sets: 3, repRange: [8, 10], increment: 2.5 },
          { id: "triceps_pushdown", name: "Triceps pushdown", sets: 3, repRange: [12, 15], increment: 2.5 },
          { id: "overhead_extension", name: "Overhead extension", sets: 3, repRange: [12, 15], increment: 2.5 },
        ],
      },
      legs_bro: {
        label: "Day 5 — Legs",
        exercises: [
          { id: "squat", name: "Squat", sets: 4, repRange: [6, 8], increment: 2.5 },
          { id: "leg_press", name: "Leg press", sets: 3, repRange: [10, 12], increment: 5 },
          { id: "rdl", name: "Romanian deadlift", sets: 3, repRange: [8, 10], increment: 5 },
          { id: "leg_extension", name: "Leg extension", sets: 3, repRange: [12, 15], increment: 5 },
          { id: "leg_curl", name: "Leg curl", sets: 3, repRange: [12, 15], increment: 2.5 },
          { id: "calf_raise", name: "Calf raise", sets: 4, repRange: [10, 12], increment: 2.5 },
        ],
      },
    },
  },

  arnold: {
    id: "arnold",
    name: "Arnold Split",
    description: "3-day antagonist pairing split",
    days: {
      chest_back: {
        label: "Day 1 — Chest & Back",
        exercises: [
          { id: "bench_press", name: "Bench press", sets: 4, repRange: [6, 8], increment: 2.5 },
          { id: "incline_db_press", name: "Incline DB press", sets: 3, repRange: [8, 10], increment: 2.5 },
          { id: "barbell_row", name: "Barbell row", sets: 4, repRange: [6, 8], increment: 2.5 },
          { id: "weighted_pullup", name: "Weighted pull-up", sets: 3, repRange: [8, 10], increment: 2.5 },
          { id: "cable_fly", name: "Cable fly", sets: 3, repRange: [12, 15], increment: 2.5 },
          { id: "cable_row", name: "Cable row", sets: 3, repRange: [10, 12], increment: 2.5 },
        ],
      },
      shoulders_arms: {
        label: "Day 2 — Shoulders & Arms",
        exercises: [
          { id: "ohp", name: "Overhead press", sets: 4, repRange: [6, 8], increment: 2.5 },
          { id: "lateral_raise", name: "Lateral raise", sets: 3, repRange: [12, 15], increment: 2.5 },
          { id: "barbell_curl", name: "Barbell curl", sets: 3, repRange: [8, 10], increment: 2.5 },
          { id: "triceps_pushdown", name: "Triceps pushdown", sets: 3, repRange: [10, 12], increment: 2.5 },
          { id: "hammer_curl", name: "Hammer curl", sets: 3, repRange: [10, 12], increment: 2.5 },
          { id: "overhead_extension", name: "Overhead extension", sets: 3, repRange: [10, 12], increment: 2.5 },
        ],
      },
      legs_arnold: {
        label: "Day 3 — Legs",
        exercises: [
          { id: "squat", name: "Squat", sets: 4, repRange: [4, 6], increment: 2.5 },
          { id: "rdl", name: "Romanian deadlift", sets: 3, repRange: [8, 10], increment: 5 },
          { id: "leg_press", name: "Leg press", sets: 3, repRange: [10, 12], increment: 5 },
          { id: "leg_curl", name: "Leg curl", sets: 3, repRange: [10, 12], increment: 2.5 },
          { id: "leg_extension", name: "Leg extension", sets: 3, repRange: [12, 15], increment: 5 },
          { id: "calf_raise", name: "Calf raise", sets: 4, repRange: [10, 12], increment: 2.5 },
        ],
      },
    },
  },
};

export const PLAN_IDS = Object.keys(PLANS);

// Backward-compatible alias — points to the default plan's days
export const PROGRAM = PLANS.upper_lower.days;
export const DAY_TYPES = Object.keys(PROGRAM) as Array<keyof typeof PROGRAM>;

// Search ALL plans for an exercise by ID
export function getExerciseById(id: string): Exercise | undefined {
  for (const plan of Object.values(PLANS)) {
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
  for (const plan of Object.values(PLANS)) {
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
  const plan = PLANS[planId];
  if (!plan) return [];
  const exercises: Exercise[] = [];
  for (const day of Object.values(plan.days)) {
    exercises.push(...day.exercises);
  }
  return exercises;
}

// Get a day label by searching all plans
export function getDayLabel(dayType: string): string {
  for (const plan of Object.values(PLANS)) {
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
  for (const plan of Object.values(PLANS)) {
    if (plan.days[dayType]) return plan.days[dayType];
  }
  return undefined;
}
