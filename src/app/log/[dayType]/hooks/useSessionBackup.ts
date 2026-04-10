"use client";

import { useState, useEffect, type MutableRefObject } from "react";
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
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      if (!raw) return;
      const backup: BackupData = JSON.parse(raw);
      if (backup.dayType === dayType) {
        setBackupFound(true);
        setBackupStartedAt(backup.startedAt);
      }
    } catch {
      // Ignore corrupt backup
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function writeBackup(updatedExercises: ExerciseState[]) {
    if (!guidedModeRef.current) return;
    try {
      const backup: BackupData = {
        dayType,
        startedAt: startedAtRef.current,
        exercises: updatedExercises,
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    } catch {
      // Storage may be full — not critical
    }
  }

  function restoreBackup(onRestore: (exercises: ExerciseState[]) => void) {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      if (!raw) return;
      const backup: BackupData = JSON.parse(raw);
      if (backup.dayType === dayType && backup.exercises) {
        startedAtRef.current = backup.startedAt;
        onRestore(backup.exercises);
        setBackupFound(false);
      }
    } catch {
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
