"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { fetcher } from "@/lib/swr";
import { getExerciseById } from "@/lib/program";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay } from "@/lib/units";
import { estimateE1RM } from "@/lib/e1rm";

const ExerciseStatsChart = dynamic(
  () =>
    import("@/components/ExerciseStatsChart").then(
      (m) => m.ExerciseStatsChartInner
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] bg-surface rounded animate-pulse" />
    ),
  }
);

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-4">
      {children}
    </p>
  );
}

export default function ExerciseStatsPage() {
  const params = useParams();
  const exerciseId = params.exerciseId as string;
  const { unit } = useUnit();
  const exercise = getExerciseById(exerciseId);

  const { data: chartSessions } = useSWR<ChartSession[]>(
    "/api/charts/data",
    fetcher
  );

  const e1rmPoints = useMemo(() => {
    if (!chartSessions) return [];
    const points: { date: string; e1rm: number }[] = [];
    for (const session of chartSessions) {
      const exSets = session.sets.filter((s) => s.exerciseId === exerciseId);
      if (exSets.length === 0) continue;
      const bestE1rm = Math.max(
        ...exSets.map((s) => estimateE1RM(s.weight, s.reps))
      );
      points.push({
        date: session.date,
        e1rm: Math.round(kgToDisplay(bestE1rm, unit) * 10) / 10,
      });
    }
    return points;
  }, [chartSessions, exerciseId, unit]);

  const bestE1rm = useMemo(
    () => (e1rmPoints.length > 0 ? Math.max(...e1rmPoints.map((p) => p.e1rm)) : null),
    [e1rmPoints]
  );

  const recentTrend = useMemo(() => {
    if (e1rmPoints.length < 4) return null;
    const recent = e1rmPoints.slice(-3).reduce((s, p) => s + p.e1rm, 0) / 3;
    const prev = e1rmPoints.slice(-6, -3).reduce((s, p) => s + p.e1rm, 0) / 3;
    if (prev === 0) return null;
    return Math.round(((recent - prev) / prev) * 1000) / 10; // percent, 1 dp
  }, [e1rmPoints]);

  const exerciseName = exercise?.name ?? exerciseId.replace(/_/g, " ");

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
        <h1 className="text-lg font-medium">{exerciseName}</h1>
      </div>

      {/* Summary stats */}
      {e1rmPoints.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-border rounded p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-1">
              Best Est. 1RM
            </p>
            <p className="text-xl font-bold">
              {bestE1rm?.toFixed(1)}
              <span className="text-sm font-normal text-muted ml-1">{unit}</span>
            </p>
          </div>
          <div className="border border-border rounded p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-1">
              Sessions
            </p>
            <p className="text-xl font-bold">
              {e1rmPoints.length}
              {recentTrend !== null && (
                <span
                  className={`text-sm font-medium ml-2 ${
                    recentTrend >= 0 ? "text-accent" : "text-red-400"
                  }`}
                >
                  {recentTrend >= 0 ? "+" : ""}
                  {recentTrend}%
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Chart section */}
      <div className="border border-border rounded-lg p-4 space-y-4">
        <SectionLabel>Strength over time</SectionLabel>
        <div>
          <p className="text-muted text-xs mb-3">
            Est. 1RM ({unit}) &mdash; dots are past sessions, dashed line is
            projection
          </p>
          <ExerciseStatsChart data={e1rmPoints} unit={unit} />
        </div>
      </div>

      {/* Explainer */}
      <div className="border-t border-border pt-4">
        <p className="text-muted text-xs leading-relaxed">
          Each dot is your best{" "}
          <span className="text-accent font-medium">estimated 1RM</span> for
          that session, calculated with the Epley formula: weight &times; (1 +
          reps &divide; 30). The dashed line projects your trend forward 8
          weeks based on your historical rate of progress.
        </p>
      </div>
    </div>
  );
}
