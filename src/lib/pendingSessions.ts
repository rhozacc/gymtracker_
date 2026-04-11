// Offline-first session queue.
// When the DB is unavailable, sessions are saved here and synced on next load.

const PENDING_KEY = "gym-pending-sessions";

export interface PendingSessionPayload {
  date: string;
  dayType: string;
  notes?: string;
  startedAt: string;
  endedAt: string;
  sets: {
    exerciseId: string;
    setNumber: number;
    reps: number;
    weight: number;
    rir?: number;
  }[];
}

export interface PendingSession {
  localId: string;
  savedAt: string;
  payload: PendingSessionPayload;
}

export function savePendingSession(payload: PendingSessionPayload): void {
  try {
    const existing = getPendingSessions();
    const entry: PendingSession = {
      localId: `local_${Date.now()}`,
      savedAt: new Date().toISOString(),
      payload,
    };
    localStorage.setItem(PENDING_KEY, JSON.stringify([...existing, entry]));
  } catch {
    // Storage full — last resort: log to console so data isn't silently dropped
    console.error("[gymtracker] Could not save pending session to localStorage:", payload);
  }
}

export function getPendingSessions(): PendingSession[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
  } catch {
    return [];
  }
}

export function removePendingSession(localId: string): void {
  try {
    const filtered = getPendingSessions().filter((s) => s.localId !== localId);
    if (filtered.length === 0) {
      localStorage.removeItem(PENDING_KEY);
    } else {
      localStorage.setItem(PENDING_KEY, JSON.stringify(filtered));
    }
  } catch {}
}

export function hasPendingSessions(): boolean {
  return getPendingSessions().length > 0;
}
