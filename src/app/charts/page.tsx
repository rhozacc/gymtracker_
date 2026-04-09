"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { fetcher } from "@/lib/swr";
import { getAllExercises } from "@/lib/program";
import { useProgram } from "@/lib/useProgram";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay } from "@/lib/units";
import { estimateE1RM } from "@/lib/e1rm";
import { getMuscleGroup, MUSCLE_GROUPS } from "@/lib/muscleGroups";
import { StreakCalendar } from "@/components/StreakCalendar";
import { ExerciseSelect } from "@/components/ExerciseSelect";
import { KeyTrends } from "@/components/KeyTrends";
import { useInView } from "@/hooks/useInView";

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-4">
      {children}
    </p>
  );
}

function ChartSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`border border-border rounded-lg p-4 space-y-6 transition-all duration-500 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

export default function ChartsPage() {
  const { planId } = useProgram();
  const { unit } = useUnit();
  const [selectedExercise, setSelectedExercise] = useState("");
  const [bypassLock, setBypassLock] = useState(false);

  const { data: volumeData } = useSWR("/api/volume/weekly", fetcher);
  const { data: chartSessions } = useSWR<ChartSession[]>(
    "/api/charts/data",
    fetcher
  );

  // --- Derived data ---

  const exerciseSetCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!chartSessions) return counts;
    for (const session of chartSessions) {
      for (const s of session.sets) {
        counts[s.exerciseId] = (counts[s.exerciseId] || 0) + 1;
      }
    }
    return counts;
  }, [chartSessions]);

  const exerciseOptions = useMemo(() => {
    return getAllExercises().map((ex) => ({
      id: ex.id,
      name: ex.name,
      setCount: exerciseSetCounts[ex.id] || 0,
    }));
  }, [exerciseSetCounts]);

  // Auto-select top exercise once data loads
  const effectiveExercise = useMemo(() => {
    if (selectedExercise) return selectedExercise;
    const sorted = [...exerciseOptions].sort(
      (a, b) => b.setCount - a.setCount
    );
    return sorted[0]?.id || "";
  }, [selectedExercise, exerciseOptions]);

  const e1rmData = useMemo(() => {
    if (!chartSessions || !effectiveExercise) return [];
    const points: { date: string; e1rm: number }[] = [];
    for (const session of chartSessions) {
      const exSets = session.sets.filter(
        (s) => s.exerciseId === effectiveExercise
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
  }, [chartSessions, effectiveExercise, unit]);

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

  const sessionCount = chartSessions?.length ?? null;

  if (sessionCount !== null && sessionCount < 5 && !bypassLock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-4"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p className="text-sm font-medium text-text mb-1">Not quite there yet</p>
        <p className="text-xs text-muted mb-6">
          Trends unlock after {5 - sessionCount} more session{5 - sessionCount === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => setBypassLock(true)}
          className="text-xs text-muted hover:text-text transition-colors"
        >
          I don&apos;t care, show me
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-medium">Trends</h1>

      {/* ── KEY TRENDS ── */}
      <ChartSection label="Key Trends">
        <KeyTrends sessions={chartSessions || []} unit={unit} />
      </ChartSection>

      {/* ── STRENGTH ── */}
      <ChartSection label="Strength">
        <section>
          <h2 className="text-muted text-xs mb-3">
            Estimated 1RM ({unit})
          </h2>
          <ExerciseSelect
            options={exerciseOptions}
            value={effectiveExercise}
            onChange={setSelectedExercise}
          />
          <E1rmChart data={e1rmData} unit={unit} />
        </section>
      </ChartSection>

      {/* ── VOLUME ── */}
      <ChartSection label="Volume">
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
      </ChartSection>

      {/* ── SESSION ── */}
      <ChartSection label="Session">
        <section>
          <h2 className="text-muted text-xs mb-3">Session duration</h2>
          <DurationChart data={durationData} />
        </section>
        <section>
          <h2 className="text-muted text-xs mb-3">
            Activity (last 12 weeks)
          </h2>
          <StreakCalendar sessions={sessionSummaries} />
        </section>
      </ChartSection>

      {/* ── RECOVERY ── */}
      <ChartSection label="Recovery">
        <section>
          <h2 className="text-muted text-xs mb-3">Debrief trends</h2>
          <DebriefChart data={debriefData} />
        </section>
        <section>
          <h2 className="text-muted text-xs mb-3">Average RIR</h2>
          <RirChart data={rirData} />
        </section>
      </ChartSection>

      {/* ── EXPLAINER ── */}
      <div className="border border-border rounded-lg p-4 text-xs text-muted space-y-2">
        <p className="font-medium text-text">What is Est. 1RM?</p>
        <p>
          Estimated One-Rep Max predicts the maximum weight you could lift for a
          single rep, calculated from your working sets using the Epley formula:
          weight &times; (1 + reps &divide; 30). It tracks strength progress
          without actually maxing out.
        </p>
      </div>
    </div>
  );
}
