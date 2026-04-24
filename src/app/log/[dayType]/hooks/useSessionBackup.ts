"use client";

import { useState, useEffect, useMemo, type MutableRefObject } from "react";
import { authClient } from "@/lib/auth-client";
import { getJson, setJson } from "@/lib/storage";
import { BACKUP_KEY_PREFIX, type BackupData, type ExerciseState } from "../types";

export function useSessionBackup(
  dayType: string,
  startedAtRef: MutableRefObject<string>,
  guidedModeRef: MutableRefObject<boolean>
) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? "anon";
  const backupKey = useMemo(() => `${BACKUP_KEY_PREFIX}:${userId}`, [userId]);

  const [backupFound, setBackupFound] = useState(false);
  const [backupStartedAt, setBackupStartedAt] = useState<string | null>(null);

  // Check for a backup from a crashed session whenever the active user changes
  useEffect(() => {
    const backup = getJson<BackupData | null>(backupKey, null);
    if (backup?.dayType === dayType) {
      setBackupFound(true);
      setBackupStartedAt(backup.startedAt);
    } else {
      setBackupFound(false);
      setBackupStartedAt(null);
    }
  }, [backupKey, dayType]);

  function writeBackup(updatedExercises: ExerciseState[], position?: { exerciseIndex: number; setIndex: number }) {
    if (!guidedModeRef.current) return;
    setJson<BackupData>(backupKey, {
      dayType,
      startedAt: startedAtRef.current,
      exercises: updatedExercises,
      exerciseIndex: position?.exerciseIndex,
      setIndex: position?.setIndex,
    });
  }

  function patchPositionInBackup(pos: { exerciseIndex: number; setIndex: number }) {
    if (!guidedModeRef.current) return;
    const existing = getJson<BackupData | null>(backupKey, null);
    if (!existing || existing.dayType !== dayType) return;
    setJson<BackupData>(backupKey, { ...existing, exerciseIndex: pos.exerciseIndex, setIndex: pos.setIndex });
  }

  function restoreBackup(onRestore: (exercises: ExerciseState[]) => void): { exerciseIndex: number; setIndex: number } | null {
    const backup = getJson<BackupData | null>(backupKey, null);
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
    localStorage.removeItem(backupKey);
    setBackupFound(false);
  }

  function clearBackup() {
    localStorage.removeItem(backupKey);
  }

  return { backupFound, backupStartedAt, writeBackup, patchPositionInBackup, restoreBackup, discardBackup, clearBackup };
}
