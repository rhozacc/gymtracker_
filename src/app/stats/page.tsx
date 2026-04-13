"use client";

import { useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { getAllExercises } from "@/lib/program";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay } from "@/lib/units";
import { estimateE1RM } from "@/lib/e1rm";

interface ChartSession {
  id: string;
  date: string;
  sets: {
    exerciseId: string;
    reps: number;
    weight: number;
    rir: number | null;
  }[];
}

export default function StatsIndexPage() {
  const { unit } = useUnit();
  const { data: chartSessions } = useSWR<ChartSession[]>(
    "/api/charts/data",
    fetcher
  );

  const exerciseRows = useMemo(() => {
    if (!chartSessions) return [];

    const sessionCount: Record<string, number> = {};
    const bestE1rm: Record<string, number> = {};

    for (const session of chartSessions) {
      const seen = new Set<string>();
      for (const s of session.sets) {
        if (!seen.has(s.exerciseId)) {
          sessionCount[s.exerciseId] = (sessionCount[s.exerciseId] || 0) + 1;
          seen.add(s.exerciseId);
        }
        const e = estimateE1RM(s.weight, s.reps);
        if (!bestE1rm[s.exerciseId] || e > bestE1rm[s.exerciseId]) {
          bestE1rm[s.exerciseId] = e;
        }
      }
    }

    return getAllExercises()
      .filter((ex) => (sessionCount[ex.id] ?? 0) > 0)
      .map((ex) => ({
        id: ex.id,
        name: ex.name,
        sessions: sessionCount[ex.id] ?? 0,
        bestE1rm: bestE1rm[ex.id]
          ? Math.round(kgToDisplay(bestE1rm[ex.id], unit) * 10) / 10
          : null,
      }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [chartSessions, unit]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-muted hover:text-text transition-colors"
          aria-label="Back to home"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4L6 9l5 5" />
          </svg>
        </Link>
        <h1 className="text-lg font-medium">Stats</h1>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        Per-exercise strength over time — dots for past sessions, dashed line
        projects your trajectory.
      </p>

      {/* Exercise list */}
      {exerciseRows.length === 0 ? (
        <div className="border border-border rounded-lg p-8 text-center">
          <p className="text-sm text-muted">No exercise data yet.</p>
          <p className="text-xs text-muted mt-1">
            Complete a few sessions to see your stats here.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
          {exerciseRows.map(({ id, name, sessions, bestE1rm }) => (
            <Link
              key={id}
              href={`/stats/${id}`}
              className="flex items-center justify-between p-3 hover:bg-surface transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-[11px] text-muted">
                  {sessions} session{sessions !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {bestE1rm !== null && (
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {bestE1rm}
                      <span className="text-muted text-xs ml-0.5">{unit}</span>
                    </p>
                    <p className="text-[11px] text-muted">best est. 1RM</p>
                  </div>
                )}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted"
                >
                  <path d="M4 2l4 4-4 4" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
