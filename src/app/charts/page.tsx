"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { fetcher } from "@/lib/swr";
import { getAllExercises, getAllExercisesForPlan } from "@/lib/program";
import { useProgram } from "@/lib/useProgram";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay } from "@/lib/units";
import { estimateE1RM } from "@/lib/e1rm";
import { getMuscleGroup, MUSCLE_GROUPS } from "@/lib/muscleGroups";
import { StreakCalendar } from "@/components/StreakCalendar";

const chartLoading = (
  <div className="h-[280px] bg-surface rounded animate-pulse" />
);

const VolumeChart = dynamic(
  () => import("@/components/VolumeChart").then((m) => m.VolumeChartInner),
  { ssr: false, loading: () => chartLoading }
);

const E1rmChart = dynamic(
  () => import("@/components/E1rmChart").then((m) => m.E1rmChartInner),
  { ssr: false, loading: () => chartLoading }
);

const MuscleVolumeChart = dynamic(
  () =>
    import("@/components/MuscleVolumeChart").then(
      (m) => m.MuscleVolumeChartInner
    ),
  { ssr: false, loading: () => chartLoading }
);

const DurationChart = dynamic(
  () => import("@/components/DurationChart").then((m) => m.DurationChartInner),
  { ssr: false, loading: () => chartLoading }
);

const DebriefChart = dynamic(
  () => import("@/components/DebriefChart").then((m) => m.DebriefChartInner),
  { ssr: false, loading: () => chartLoading }
);

const RirChart = dynamic(
  () => import("@/components/RirChart").then((m) => m.RirChartInner),
  { ssr: false, loading: () => chartLoading }
);

interface ChartSession {
  id: string;
  date: string;
  dayType: string;
  startedAt: string | null;
  endedAt: string | null;
  sets: {
    exerciseId: string;
    setNumber: number;
    reps: number;
    weight: number;
    rir: number | null;
  }[];
  debrief: { energy: number; pump: number; mood: number } | null;
}

export default function ChartsPage() {
  const { planId } = useProgram();
  const { unit } = useUnit();
  const planExercises = getAllExercisesForPlan(planId);
  const [selectedExercise, setSelectedExercise] = useState(
    planExercises[0]?.id || ""
  );

  const { data: volumeData } = useSWR("/api/volume/weekly", fetcher);
  const { data: chartSessions } = useSWR<ChartSession[]>(
    "/api/charts/data",
    fetcher
  );

  // --- Derived data ---

  const e1rmData = useMemo(() => {
    if (!chartSessions) return [];
    const points: { date: string; e1rm: number }[] = [];
    for (const session of chartSessions) {
      const exSets = session.sets.filter(
        (s) => s.exerciseId === selectedExercise
      );
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
  }, [chartSessions, selectedExercise, unit]);

  const muscleVolumeData = useMemo(() => {
    if (!chartSessions) return [];
    const weeklyData = new Map<string, Record<string, number>>();

    for (const session of chartSessions) {
      const d = new Date(session.date);
      const day = d.getUTCDay();
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d);
      weekStart.setUTCDate(diff);
      weekStart.setUTCHours(0, 0, 0, 0);
      const key = weekStart.toISOString().split("T")[0];

      if (!weeklyData.has(key)) weeklyData.set(key, {});
      const entry = weeklyData.get(key)!;

      // Count sets per exercise, then map to muscle group
      const exerciseSets: Record<string, number> = {};
      for (const s of session.sets) {
        exerciseSets[s.exerciseId] = (exerciseSets[s.exerciseId] || 0) + 1;
      }
      for (const exId of Object.keys(exerciseSets)) {
        const mg = getMuscleGroup(exId);
        if (mg) entry[mg] = (entry[mg] || 0) + exerciseSets[exId];
      }
    }

    return Array.from(weeklyData.entries())
      .map(([week, data]) => {
        const row: { week: string; [k: string]: number | string } = { week };
        for (const mg of MUSCLE_GROUPS) row[mg] = data[mg] || 0;
        return row;
      })
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [chartSessions]);

  const durationData = useMemo(() => {
    if (!chartSessions) return [];
    return chartSessions
      .filter((s) => s.startedAt && s.endedAt)
      .map((s) => ({
        date: s.date,
        minutes: Math.round(
          (new Date(s.endedAt!).getTime() -
            new Date(s.startedAt!).getTime()) /
            60000
        ),
      }))
      .filter((d) => d.minutes > 0 && d.minutes < 300);
  }, [chartSessions]);

  const debriefData = useMemo(() => {
    if (!chartSessions) return [];
    return chartSessions
      .filter((s) => s.debrief)
      .map((s) => ({
        date: s.date,
        energy: s.debrief!.energy,
        pump: s.debrief!.pump,
        mood: s.debrief!.mood,
      }));
  }, [chartSessions]);

  const rirData = useMemo(() => {
    if (!chartSessions) return [];
    return chartSessions
      .map((s) => {
        const vals = s.sets
          .map((set) => set.rir)
          .filter((r): r is number => r != null);
        if (vals.length === 0) return null;
        return {
          date: s.date,
          avgRir:
            Math.round(
              (vals.reduce((a, b) => a + b, 0) / vals.length) * 10
            ) / 10,
        };
      })
      .filter(Boolean) as { date: string; avgRir: number }[];
  }, [chartSessions]);

  const sessionSummaries = useMemo(() => {
    if (!chartSessions) return [];
    return chartSessions.map((s) => ({ date: s.date, dayType: s.dayType }));
  }, [chartSessions]);

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-medium">Charts</h1>

      {/* --- Strength --- */}
      <section>
        <h2 className="text-muted text-xs mb-3">
          Estimated 1RM ({unit})
        </h2>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full h-10 bg-surface border border-border text-text text-sm rounded px-3 mb-3 focus:border-accent focus:outline-none"
        >
          {getAllExercises().map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
        <E1rmChart data={e1rmData} unit={unit} />
      </section>

      {/* --- Volume --- */}
      <section>
        <h2 className="text-muted text-xs mb-3">Weekly volume</h2>
        {volumeData && volumeData.length > 0 ? (
          <VolumeChart data={volumeData} unit={unit} />
        ) : (
          <p className="text-muted text-sm text-center py-8 border border-border rounded">
            No data yet.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-muted text-xs mb-3">Sets per muscle group</h2>
        <MuscleVolumeChart data={muscleVolumeData} />
      </section>

      {/* --- Session --- */}
      <section>
        <h2 className="text-muted text-xs mb-3">Session duration</h2>
        <DurationChart data={durationData} />
      </section>

      {/* --- Recovery --- */}
      <section>
        <h2 className="text-muted text-xs mb-3">Debrief trends</h2>
        <DebriefChart data={debriefData} />
      </section>

      <section>
        <h2 className="text-muted text-xs mb-3">Average RIR</h2>
        <RirChart data={rirData} />
      </section>

      {/* --- Activity --- */}
      <section>
        <h2 className="text-muted text-xs mb-3">Activity (last 12 weeks)</h2>
        <StreakCalendar sessions={sessionSummaries} />
      </section>
    </div>
  );
}
