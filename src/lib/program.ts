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

export const PROGRAM: Record<string, DayDefinition> = {
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
};

export const DAY_TYPES = Object.keys(PROGRAM) as Array<keyof typeof PROGRAM>;

export function getExerciseById(id: string): Exercise | undefined {
  for (const day of Object.values(PROGRAM)) {
    const ex = day.exercises.find((e) => e.id === id);
    if (ex) return ex;
  }
  return undefined;
}

export function getAllExercises(): Exercise[] {
  const exercises: Exercise[] = [];
  for (const day of Object.values(PROGRAM)) {
    exercises.push(...day.exercises);
  }
  return exercises;
}
