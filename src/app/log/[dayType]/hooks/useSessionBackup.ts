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

  function writeBackup(updatedExercises: ExerciseState[]) {
    if (!guidedModeRef.current) return;
    setJson<BackupData>(BACKUP_KEY, {
      dayType,
      startedAt: startedAtRef.current,
      exercises: updatedExercises,
    });
  }

  function restoreBackup(onRestore: (exercises: ExerciseState[]) => void) {
    const backup = getJson<BackupData | null>(BACKUP_KEY, null);
    if (backup?.dayType === dayType && backup.exercises) {
      startedAtRef.current = backup.startedAt;
      onRestore(backup.exercises);
      setBackupFound(false);
    } else {
      setBackupFound(false);
    }
  }

  function discardBackup() {
    localStorage.removeItem(BACKUP_KEY);
    setBackupFound(false);
  }

  function clearBackup() {
    localStorage.removeItem(BACKUP_KEY);
  }

  return { backupFound, backupStartedAt, writeBackup, restoreBackup, discardBackup, clearBackup };
}
