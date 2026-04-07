export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function calculateVolume(
  sets: { reps: number; weight: number }[]
): number {
  return sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function getISOWeekString(date: Date): string {
  const ws = getWeekStart(date);
  return ws.toISOString().split("T")[0];
}

export function calculateStreak(
  sessions: { date: string | Date }[]
): number {
  if (sessions.length === 0) return 0;

  const weekMap = new Map<string, number>();
  for (const s of sessions) {
    const key = getISOWeekString(new Date(s.date));
    weekMap.set(key, (weekMap.get(key) || 0) + 1);
  }

  const now = new Date();
  let current = getWeekStart(now);
  let streak = 0;

  // Current week: count if at least 1 session
  const currentKey = current.toISOString().split("T")[0];
  const currentCount = weekMap.get(currentKey) || 0;
  if (currentCount >= 1) {
    streak = 1;
  }

  // Walk backward checking for >= 2 sessions per week
  current.setUTCDate(current.getUTCDate() - 7);
  while (true) {
    const key = current.toISOString().split("T")[0];
    const count = weekMap.get(key) || 0;
    if (count >= 2) {
      streak++;
      current.setUTCDate(current.getUTCDate() - 7);
    } else {
      break;
    }
  }

  return streak;
}
