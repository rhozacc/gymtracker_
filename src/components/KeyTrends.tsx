"use client";

import { useMemo } from "react";
import { getExerciseById } from "@/lib/program";
import { estimateE1RM } from "@/lib/e1rm";
import { kgToDisplay } from "@/lib/units";

interface SetData {
  exerciseId: string;
  reps: number;
  weight: number;
}

interface SessionData {
  date: string;
  sets: SetData[];
}

interface TrendItem {
  exerciseId: string;
  name: string;
  pctChange: number;
}

export function KeyTrends({
  sessions,
  unit,
}: {
  sessions: SessionData[];
  unit: string;
}) {
  const trends = useMemo(() => {
    if (!sessions || sessions.length < 2) return [];

    // Group best E1RM per exercise per session
    const exerciseSessionMap: Record<string, { date: string; e1rm: number }[]> = {};

    for (const session of sessions) {
      const bestPerExercise: Record<string, number> = {};
      for (const s of session.sets) {
        const e1rm = estimateE1RM(s.weight, s.reps);
        const current = bestPerExercise[s.exerciseId] || 0;
        if (e1rm > current) bestPerExercise[s.exerciseId] = e1rm;
      }
      for (const exId of Object.keys(bestPerExercise)) {
        const e1rm = bestPerExercise[exId];
        if (!exerciseSessionMap[exId]) exerciseSessionMap[exId] = [];
        exerciseSessionMap[exId].push({ date: session.date, e1rm });
      }
    }

    const results: TrendItem[] = [];

    for (const exId of Object.keys(exerciseSessionMap)) {
      const points = exerciseSessionMap[exId];
      if (points.length < 6) continue;

      // Sort by date descending
      points.sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date));

      const recent3 = points.slice(0, 3);
      const older3 = points.slice(3, 6);

      const recentAvg = recent3.reduce((sum: number, p: { e1rm: number }) => sum + p.e1rm, 0) / 3;
      const olderAvg = older3.reduce((sum: number, p: { e1rm: number }) => sum + p.e1rm, 0) / 3;

      if (olderAvg === 0) continue;

      const pctChange = ((recentAvg - olderAvg) / olderAvg) * 100;
      const ex = getExerciseById(exId);

      results.push({
        exerciseId: exId,
        name: ex?.name || exId,
        pctChange: Math.round(pctChange * 10) / 10,
      });
    }

    return results;
  }, [sessions]);

  if (trends.length === 0) {
    return (
      <p className="text-muted text-sm text-center py-6">
        Need 6+ sessions per exercise to detect trends.
      </p>
    );
  }

  const improving = trends
    .filter((t) => t.pctChange > 2)
    .sort((a, b) => b.pctChange - a.pctChange)
    .slice(0, 5);

  const declining = trends
    .filter((t) => t.pctChange < -2)
    .sort((a, b) => a.pctChange - b.pctChange)
    .slice(0, 5);

  const neutral = trends.filter(
    (t) => t.pctChange >= -2 && t.pctChange <= 2
  );

  return (
    <div className="space-y-3">
      {improving.length > 0 && (
        <div className="space-y-1.5">
          {improving.map((t) => (
            <div
              key={t.exerciseId}
              className="flex items-center justify-between text-sm"
            >
              <span className="truncate">{t.name}</span>
              <span className="text-green-400 text-xs font-medium tabular-nums ml-2 shrink-0">
                +{t.pctChange}%
              </span>
            </div>
          ))}
        </div>
      )}

      {declining.length > 0 && (
        <div className="space-y-1.5">
          {declining.map((t) => (
            <div
              key={t.exerciseId}
              className="flex items-center justify-between text-sm"
            >
              <span className="truncate">{t.name}</span>
              <span className="text-red-400 text-xs font-medium tabular-nums ml-2 shrink-0">
                {t.pctChange}%
              </span>
            </div>
          ))}
        </div>
      )}

      {neutral.length > 0 && improving.length === 0 && declining.length === 0 && (
        <p className="text-muted text-sm text-center">
          All tracked exercises are holding steady.
        </p>
      )}
    </div>
  );
}
