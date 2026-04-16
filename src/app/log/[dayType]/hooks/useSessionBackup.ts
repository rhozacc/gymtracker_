"use client";

import { useState, useEffect, type MutableRefObject } from "react";
import { getJson, setJson } from "@/lib/storage";
import { BACKUP_KEY, type BackupData, type ExerciseState } from "../types";

export function useSessionBackup(
  dayType: string,
  startedAtRef: MutableRefObject<string>,
  guidedModeRef: MutableRefObject<boolean>
) {
  const [backupFound, setBackupFound] = useState(false);
  const [backupStartedAt, setBackupStartedAt] = useState<string | null>(null);

  // Check for a backup from a crashed session on mount
  useEffect(() => {
    const backup = getJson<BackupData | null>(BACKUP_KEY, null);
    if (backup?.dayType === dayType) {
      setBackupFound(true);
      setBackupStartedAt(backup.startedAt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function writeBackup(updatedExercises: ExerciseState[], position?: { exerciseIndex: number; setIndex: number }) {
    if (!guidedModeRef.current) return;
    setJson<BackupData>(BACKUP_KEY, {
      dayType,
      startedAt: startedAtRef.current,
      exercises: updatedExercises,
      exerciseIndex: position?.exerciseIndex,
      setIndex: position?.setIndex,
    });
  }

  function patchPositionInBackup(pos: { exerciseIndex: number; setIndex: number }) {
    if (!guidedModeRef.current) return;
    const existing = getJson<BackupData | null>(BACKUP_KEY, null);
    if (!existing || existing.dayType !== dayType) return;
    setJson<BackupData>(BACKUP_KEY, { ...existing, exerciseIndex: pos.exerciseIndex, setIndex: pos.setIndex });
  }

  function restoreBackup(onRestore: (exercises: ExerciseState[]) => void): { exerciseIndex: number; setIndex: number } | null {
    const backup = getJson<BackupData | null>(BACKUP_KEY, null);
    if (backup?.dayType === dayType && backup.exercises) {
      startedAtRef.current = backup.startedAt;
      onRestore(backup.exercises);
      setBackupFound(false);
      return { exerciseIndex: backup.exerciseIndex ?? 0, setIndex: backup.setIndex ?? 0 };
    } else {
      setBackupFound(false);
      return null;
    }
  }

  function discardBackup() {
    localStorage.removeItem(BACKUP_KEY);
    setBackupFound(false);
  }

  function clearBackup() {
    localStorage.removeItem(BACKUP_KEY);
  }

  return { backupFound, backupStartedAt, writeBackup, patchPositionInBackup, restoreBackup, discardBackup, clearBackup };
}
