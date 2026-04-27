import type { MuscleGroup } from "./muscleGroups";

// Weekly set targets per muscle group (RP Strength / meta-analysis consensus).
// MEV — minimum effective volume to maintain / drive any growth.
// MAV — minimum needed for a robust hypertrophy stimulus.

export const MEV_TARGETS: Record<MuscleGroup, number> = {
  Chest: 10,
  Back: 12,
  Shoulders: 10,
  Legs: 14,
  Arms: 8,
};

export const MAV_TARGETS: Record<MuscleGroup, number> = {
  Chest: 12,
  Back: 14,
  Shoulders: 12,
  Legs: 18,
  Arms: 10,
};
