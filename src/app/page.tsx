"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { fetcher } from "@/lib/swr";
import { getDayLabel } from "@/lib/program";
import { useProgram } from "@/lib/useProgram";
import { useUnit } from "@/lib/useUnit";
import { useTheme } from "@/lib/useTheme";
import { kgToDisplay } from "@/lib/units";
import { calculateStreak, formatDate } from "@/lib/utils";
import { StreakCalendar } from "@/components/StreakCalendar";
import { getMuscleGroup, MUSCLE_GROUPS } from "@/lib/muscleGroups";

const MuscleRadar = dynamic(
  () => import("@/components/MuscleRadar").then((m) => m.MuscleRadarInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] bg-surface rounded animate-pulse" />
    ),
  }
);

interface SessionSummary {
  id: string;
  date: string;
  dayType: string;
  setCount: number;
  totalVolume: number;
}

interface ChartSession {
  id: string;
  date: string;
  dayType: string;
  sets: { exerciseId: string; reps: number; weight: number }[];
}

function getNextDayType(
  lastDayType: string | undefined,
  dayKeys: string[]
): string {
  if (!lastDayType || dayKeys.length === 0) return dayKeys[0];
  const lastIdx = dayKeys.indexOf(lastDayType);
  if (lastIdx === -1) return dayKeys[0];
  return dayKeys[(lastIdx + 1) % dayKeys.length];
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-3">
      {children}
    </p>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { plan } = useProgram();
  const { unit } = useUnit();
  const { theme, toggleTheme } = useTheme();
  const { data: sessions, error: sessionsError } =
    useSWR<SessionSummary[]>("/api/sessions", fetcher);
  const { data: chartData } = useSWR<ChartSession[]>(
    "/api/charts/data",
    fetcher
  );
  const defaultKeys = Object.keys(plan.days);

  const streak = sessions ? calculateStreak(sessions) : 0;
  const lastSession = sessions?.[0];
  const nextDayType = getNextDayType(lastSession?.dayType, defaultKeys);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const effectiveSelected = selectedDay || nextDayType;

  const muscleRadarData = useMemo(() => {
    if (!chartData) return [];
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now);
    weekStart.setUTCDate(diff);
    weekStart.setUTCHours(0, 0, 0, 0);

    const counts: Record<string, number> = {};
    for (const mg of MUSCLE_GROUPS) counts[mg] = 0;

    for (const session of chartData) {
      const d = new Date(session.date);
      if (d < weekStart) continue;
      const exerciseSets: Record<string, number> = {};
      for (const s of session.sets) {
        exerciseSets[s.exerciseId] = (exerciseSets[s.exerciseId] || 0) + 1;
      }
      for (const exId of Object.keys(exerciseSets)) {
        const mg = getMuscleGroup(exId);
        if (mg) counts[mg] += exerciseSets[exId];
      }
    }

    return MUSCLE_GROUPS.map((mg) => ({ muscle: mg, sets: counts[mg] }));
  }, [chartData]);

  const sessionsWithVolume = useMemo(() => {
    if (!sessions) return [];
    return sessions.map((s) => ({
      date: s.date,
      dayType: s.dayType,
      totalVolume: s.totalVolume,
    }));
  }, [sessions]);

  return (
    <div className="space-y-14">
      {sessionsError && (
        <div className="border border-red-500/30 bg-red-950/20 rounded p-3 text-sm">
          <span className="text-red-400 font-medium">
            No database connected.
          </span>
          <span className="text-muted ml-1">
            Sessions won&apos;t be saved. Add a Neon Postgres database in your
            Vercel project settings.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:border-accent hover:text-accent transition-colors"
            aria-label="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:border-accent hover:text-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold">{streak}</span>
          <span className="text-muted text-sm ml-1">week streak</span>
        </div>
      </div>

      {/* ── Last Session ── */}
      {lastSession && (
        <div>
          <Link href="/history" className="flex items-center justify-between mb-3 group">
            <h2 className="text-lg font-medium">Last Session</h2>
            <span className="flex items-center gap-1.5 text-muted group-hover:text-text transition-colors">
              <span className="text-xs">Log</span>
              <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 10L10 2M10 2H4.5M10 2V7.5"/>
              </svg>
            </span>
          </Link>
          <Link
            href={`/history/${lastSession.id}`}
            className="block border border-border rounded p-3 hover:border-muted transition-colors"
          >
            <div className="flex justify-between items-baseline">
              <span className="text-sm">
                {getDayLabel(lastSession.dayType)}
              </span>
              <span className="text-muted text-xs">
                {formatDate(lastSession.date)}
              </span>
            </div>
            <div className="text-muted text-xs mt-1">
              {lastSession.setCount} sets &middot;{" "}
              {Math.round(
                kgToDisplay(lastSession.totalVolume, unit)
              ).toLocaleString()}{" "}
              {unit} volume
            </div>
          </Link>
        </div>
      )}

      {/* ── Start Session ── */}
      <div>
        <Link href="/plan" className="flex items-center justify-between mb-3 group">
          <h2 className="text-lg font-medium">Up Next</h2>
          <span className="flex items-center gap-1.5 text-muted group-hover:text-text transition-colors">
            <span className="text-xs">Plans</span>
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 10L10 2M10 2H4.5M10 2V7.5"/>
            </svg>
          </span>
        </Link>
        <div className="grid grid-cols-1 gap-2">
          {defaultKeys.map((key) => {
            const day = plan.days[key];
            if (!day) return null;
            const isSelected = key === effectiveSelected;

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(key)}
                className={`w-full text-left block border rounded p-3 transition-colors text-sm ${
                  isSelected
                    ? "border-accent bg-accent/5 animate-pulse-border"
                    : "border-border hover:border-muted"
                }`}
              >
                {day.label}
                <span className="text-muted ml-2 text-xs">
                  {day.exercises.length} exercises
                </span>
                {isSelected && (
                  <span className="text-accent text-xs ml-2 font-medium">
                    Next up
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => router.push(`/log/${effectiveSelected}?guided=true`)}
          className="w-full h-12 mt-3 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          Start {getDayLabel(effectiveSelected)} Session
        </button>
      </div>

      {/* ── Progress ── */}
      <div>
        <Link href="/charts" className="flex items-center justify-between mb-3 group">
          <h2 className="text-lg font-medium">Progress</h2>
          <span className="flex items-center gap-1.5 text-muted group-hover:text-text transition-colors">
            <span className="text-xs">Trends</span>
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 10L10 2M10 2H4.5M10 2V7.5"/>
            </svg>
          </span>
        </Link>

        {sessions && sessions.length > 0 && (
          <div className="mb-4">
            <div className="text-muted text-xs mb-2">
              Activity (last 12 weeks)
            </div>
            <StreakCalendar sessions={sessionsWithVolume} />
          </div>
        )}

        <div>
          <div className="text-muted text-xs mb-2">
            Muscle groups (this week)
          </div>
          <MuscleRadar data={muscleRadarData} />
        </div>
      </div>

    </div>
  );
}
