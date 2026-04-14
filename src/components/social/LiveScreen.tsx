"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { getAllExercises } from "@/lib/program";

interface LiveData {
  count: number;
  sessions: { startedAt: string; durationMin: number }[];
  topExercises: { exerciseId: string; setCount: number }[];
}

function exerciseName(id: string) {
  const all = getAllExercises();
  return all.find((e) => e.id === id)?.name ?? id;
}

function PulseDot() {
  return (
    <span className="relative inline-flex h-2 w-2 mr-2">
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

  return (
    <div className="shrink-0 w-full px-4 pt-6 pb-24">
      {/* Live now */}
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-4">
        Live now
      </p>

      <div className="border border-border rounded-lg p-4 mb-6">
        {!data ? (
          <div className="h-16 bg-surface rounded animate-pulse" />
        ) : data.count === 0 ? (
          <p className="text-muted text-sm">No one training right now.</p>
        ) : (
          <>
            <div className="flex items-center mb-3">
              <PulseDot />
              <span className="text-text font-medium text-sm">
                {data.count} {data.count === 1 ? "session" : "sessions"} in progress
              </span>
            </div>
            <div className="space-y-2">
              {data.sessions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted">Session</span>
                  <span className="text-text tabular-nums">
                    {s.durationMin}m
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Trending this week */}
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-4">
        Trending this week
      </p>

      <div className="border border-border rounded-lg divide-y divide-border">
        {!data ? (
          <div className="h-40 bg-surface rounded animate-pulse" />
        ) : data.topExercises.length === 0 ? (
          <div className="p-4">
            <p className="text-muted text-sm">No data yet.</p>
          </div>
        ) : (
          data.topExercises.map((ex, i) => {
            const maxSets = data.topExercises[0].setCount;
            return (
              <div key={ex.exerciseId} className="px-4 py-3 flex items-center gap-3">
                <span className="text-muted text-[11px] w-4 tabular-nums">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-text text-sm truncate">
                    {exerciseName(ex.exerciseId)}
                  </p>
                  <div className="mt-1 h-[3px] rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((ex.setCount / maxSets) * 100)}%`,
                        backgroundColor: "var(--color-accent)",
                        opacity: 0.6 + 0.4 * (ex.setCount / maxSets),
                      }}
                    />
                  </div>
                </div>
                <span className="text-muted text-[11px] tabular-nums whitespace-nowrap">
                  {ex.setCount} sets
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
