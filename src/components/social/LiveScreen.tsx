"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr";

interface LiveData {
  count: number;
  sessions: { startedAt: string; durationMin: number }[];
  topExercises: { exerciseId: string; setCount: number }[];
}

function PulseDot() {
  return (
    <span className="relative inline-flex h-2 w-2 mr-2 shrink-0">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ backgroundColor: "var(--color-accent)" }}
      />
      <span
        className="relative inline-flex rounded-full h-2 w-2"
        style={{ backgroundColor: "var(--color-accent)" }}
      />
    </span>
  );
}

export function LiveScreen() {
  const { data } = useSWR<LiveData>("/api/social/live", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  if (!data) {
    return <div className="h-16 bg-surface rounded animate-pulse" />;
  }

  if (data.count === 0) {
    return <p className="text-muted text-sm">No one training right now.</p>;
  }

  return (
    <div>
      <div className="flex items-center mb-3">
        <PulseDot />
        <span className="text-sm font-medium">
          {data.count} {data.count === 1 ? "session" : "sessions"} in progress
        </span>
      </div>
      <div className="space-y-2">
        {data.sessions.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted">Session</span>
            <span className="text-text tabular-nums">{s.durationMin}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}
