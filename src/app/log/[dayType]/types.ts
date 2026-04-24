import type { SetInput } from "@/components/SetRow";

export const BACKUP_KEY_PREFIX = "gym-guided-backup";

export interface BackupData {
  dayType: string;
  startedAt: string;
  exercises: { exerciseId: string; sets: SetInput[] }[];
  exerciseIndex?: number;
  setIndex?: number;
}

export interface ExerciseState {
  exerciseId: string;
  sets: SetInput[];
}
