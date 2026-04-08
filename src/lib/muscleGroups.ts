export type MuscleGroup = "Chest" | "Back" | "Shoulders" | "Legs" | "Arms";

export const MUSCLE_GROUPS: MuscleGroup[] = ["Chest", "Back", "Shoulders", "Legs", "Arms"];

const MAP: Record<string, MuscleGroup> = {
  // Chest
  bench_press: "Chest",
  incline_db_press: "Chest",
  cable_fly: "Chest",
  fly_machine: "Chest",
  pec_deck: "Chest",
  dips: "Chest",
  weighted_dips: "Chest",
  close_grip_bench: "Chest",

  // Back
  barbell_row: "Back",
  pulldown: "Back",
  weighted_pullup: "Back",
  cable_row: "Back",
  straight_arm_pulldown: "Back",
  deadlift: "Back",
  face_pull: "Back",

  // Shoulders
  ohp: "Shoulders",
  seated_db_press: "Shoulders",
  lateral_raise: "Shoulders",
  cable_lateral_raise: "Shoulders",
  rear_delt_fly: "Shoulders",
  shrugs: "Shoulders",

  // Legs
  squat: "Legs",
  rdl: "Legs",
  bulgarian_split_squat: "Legs",
  leg_press: "Legs",
  walking_lunge: "Legs",
  leg_curl: "Legs",
  lying_curl: "Legs",
  leg_extension: "Legs",
  calf_raise: "Legs",

  // Arms
  biceps_curl: "Arms",
  barbell_curl: "Arms",
  hammer_curl: "Arms",
  preacher_curl: "Arms",
  triceps: "Arms",
  triceps_pushdown: "Arms",
  overhead_extension: "Arms",
};

export function getMuscleGroup(exerciseId: string): MuscleGroup | null {
  return MAP[exerciseId] ?? null;
}
