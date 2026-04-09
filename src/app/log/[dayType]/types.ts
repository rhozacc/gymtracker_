import type { SetInput } from "@/components/SetRow";

export const BACKUP_KEY = "gym-guided-backup";

export interface BackupData {
  dayType: string;
  startedAt: string;
  exercises: { exerciseId: string; sets: SetInput[] }[];
}

export interface ExerciseState {
  exerciseId: string;
  sets: SetInput[];
}
