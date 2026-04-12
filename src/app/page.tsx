"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { fetcher } from "@/lib/swr";
import { getPendingSessions, removePendingSession, hasPendingSessions } from "@/lib/pendingSessions";
import { getDayLabel } from "@/lib/program";
import { checkOverload } from "@/lib/overload";
import { useProgram } from "@/lib/useProgram";
import { useUnit } from "@/lib/useUnit";
import { useTheme } from "@/lib/useTheme";
import { kgToDisplay } from "@/lib/units";
import { calculateStreak, formatDate } from "@/lib/utils";
import { StreakCalendar } from "@/components/StreakCalendar";
import { getMuscleGroup, MUSCLE_GROUPS } from "@/lib/muscleGroups";
import { InstallPrompt } from "@/components/InstallPrompt";

const MuscleRadar = dynamic(
  () => import("@/components/MuscleRadar").then((m) => m.MuscleRadarInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] bg-surface rounded animate-pulse" />
    ),
  }
);

// ── Session loading screen ─────────────────────────────────────────────────────

const SESSION_LOADING_MESSAGES = [
  "syncing your gains",
  "loading session history",
  "fetching your progress",
  "pulling last session",
  "retrieving your data",
  "loading workout history",
  "syncing with the server",
  "reading your training log",
  "almost there",
  "preparing dashboard",
];

const SESSION_LOADING_CIRCLES: [number, number, number, number, number][] = [
  // cx%, cy%, size-vw, duration-ms, delay-ms
  [50, 50,  85, 2400,    0],
  [20, 25,  55, 2000,  600],
  [78, 22,  45, 2200, 1200],
  [62, 76,  60, 1800,  300],
  [14, 65,  40, 2600,  900],
  [84, 60,  48, 2100, 1500],
];

function SessionLoadingScreen() {
  const [message] = useState(
    () => SESSION_LOADING_MESSAGES[Math.floor(Math.random() * SESSION_LOADING_MESSAGES.length)]
  );

  return (
    <div className="fixed inset-0 z-[200] bg-bg overflow-hidden pointer-events-none">
      {SESSION_LOADING_CIRCLES.map(([cx, cy, size, duration, delay], i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${cx}%`,
            top: `${cy}%`,
            width: `${size}vw`,
            height: `${size}vw`,
            transform: "translate(-50%, -50%) scale(0)",
            border: "1.5px solid var(--color-accent)",
            animation: `uc-expand ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms infinite`,
          }}
        />
      ))}
      <p className="absolute bottom-16 left-6 z-10 text-3xl font-bold text-text leading-tight">
        {message}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

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
  sets: { exerciseId: string; reps: number; weight: number; rir: number | null }[];
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

export default function Dashboard() {
  const router = useRouter();
  const { plan } = useProgram();
  const { unit } = useUnit();
  const { theme, preference: themePref, toggleTheme } = useTheme();
  const { data: sessions, error: sessionsError, mutate: mutateSessions } =
    useSWR<SessionSummary[]>("/api/sessions", fetcher);
  const { data: chartData } = useSWR<ChartSession[]>(
    "/api/charts/data",
    fetcher
  );
  const dayKeys = Object.keys(plan.days).sort((a, b) => {
    const numA = parseInt(plan.days[a].label.match(/Day (\d+)/)?.[1] ?? "0");
    const numB = parseInt(plan.days[b].label.match(/Day (\d+)/)?.[1] ?? "0");
    return numA - numB;
  });

  const streak = sessions ? calculateStreak(sessions) : 0;
  const lastSession = sessions?.[0];
  const nextDayType = getNextDayType(lastSession?.dayType, dayKeys);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [recoveredBackup, setRecoveredBackup] = useState<{ dayType: string; startedAt: string } | null>(null);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);
  const effectiveSelected = selectedDay || nextDayType;

  // Pending session sync
  const [syncState, setSyncState] = useState<"idle" | "success">("idle");
  const [syncCount, setSyncCount] = useState(0);
  const syncAttemptedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gym-guided-backup");
      if (!raw) return;
      const backup = JSON.parse(raw);
      if (backup.dayType && backup.startedAt) {
        setRecoveredBackup({ dayType: backup.dayType, startedAt: backup.startedAt });
        setSelectedDay(backup.dayType);
      }
    } catch {
      // ignore corrupt backup
    }
  }, []);

  // Sync pending sessions when DB becomes available
  useEffect(() => {
    if (!sessions || sessionsError) return;
    if (syncAttemptedRef.current) return;
    if (!hasPendingSessions()) return;

    syncAttemptedRef.current = true;

    async function syncAll() {
      const pending = getPendingSessions();
      if (pending.length === 0) return;

      let synced = 0;
      for (const ps of pending) {
        try {
          const res = await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ps.payload),
          });
          if (res.ok) {
            removePendingSession(ps.localId);
            synced++;
          }
        } catch {
          // Keep this one for the next attempt
        }
      }

      if (synced > 0) {
        setSyncCount(synced);
        setSyncState("success");
        mutateSessions();
        setTimeout(() => setSyncState("idle"), 6000);
      }
    }

    syncAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, sessionsError]);

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

  const overloadHighlights = useMemo(() => {
    if (!chartData || !plan) return [];

    // Build map: exerciseId → sets from its most recent session
    const lastSetsByExercise: Record<string, { reps: number; weight: number; rir: number | null }[]> = {};
    for (const session of [...chartData].reverse()) {
      const grouped: Record<string, typeof session.sets> = {};
      for (const s of session.sets) {
        if (!grouped[s.exerciseId]) grouped[s.exerciseId] = [];
        grouped[s.exerciseId].push(s);
      }
      for (const [exId, sets] of Object.entries(grouped)) {
        if (!lastSetsByExercise[exId]) lastSetsByExercise[exId] = sets;
      }
    }

    const results: {
      name: string;
      dayLabel: string;
      status: "go_up" | "almost_ready";
      suggestedWeight: number;
      lastWeight: number;
    }[] = [];
    const seen = new Set<string>();

    for (const day of Object.values(plan.days)) {
      for (const ex of day.exercises) {
        if (seen.has(ex.id)) continue;
        seen.add(ex.id);
        const lastSets = lastSetsByExercise[ex.id] ?? [];
        if (lastSets.length === 0) continue;
        const result = checkOverload(ex, lastSets);
        if (result.status === "go_up" || result.status === "almost_ready") {
          results.push({
            name: ex.name,
            dayLabel: day.label,
            status: result.status,
            suggestedWeight: result.suggestedWeight,
            lastWeight: result.lastWeight,
          });
        }
      }
    }

    return results.sort((a, b) =>
      (a.status === "go_up" ? -1 : 1) - (b.status === "go_up" ? -1 : 1)
    );
  }, [chartData, plan]);

  return (
    <>
      <InstallPrompt />
      {sessions === undefined && !sessionsError && <SessionLoadingScreen />}
    <div className="space-y-14">
      {sessionsError && (
        <div className="border border-yellow-500/20 bg-yellow-950/10 rounded p-3">
          <p className="text-sm text-yellow-400/90 font-medium">Resolving Technical Issues.</p>
          <p className="text-xs text-muted mt-0.5">Your session will be stored locally, and synced to cloud when resolved.</p>
        </div>
      )}

      {syncState === "success" && (
        <div className="border border-green-500/30 bg-green-950/10 rounded p-3">
          <p className="text-sm text-green-400 font-medium">Sync Successful.</p>
          <p className="text-xs text-muted mt-0.5">
            {syncCount === 1 ? "Your session is" : `${syncCount} sessions are`} now recorded.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted hover:border-accent hover:text-accent transition-colors"
            aria-label="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted hover:border-accent hover:text-accent transition-colors"
            aria-label="Toggle theme"
          >
            {themePref === "system" ? (
              /* Auto icon — half sun / half moon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              </svg>
            ) : theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <span className="text-xs">Plans & custom</span>
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 10L10 2M10 2H4.5M10 2V7.5"/>
            </svg>
          </span>
        </Link>
        <div className="grid grid-cols-1 gap-2">
          {dayKeys.map((key) => {
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
          className={`w-full h-12 mt-3 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-all ${
            recoveredBackup ? "shadow-[0_0_24px_rgba(57,255,20,0.35)]" : ""
          }`}
        >
          {recoveredBackup ? (
            <span className="flex items-center justify-center gap-2">
              <span>Continue unfinished session</span>
              <span className="text-[10px] font-medium uppercase tracking-wider bg-bg/20 rounded-full px-2 py-0.5 leading-none">
                In Progress
              </span>
            </span>
          ) : (
            `Start ${getDayLabel(effectiveSelected)} Session`
          )}
        </button>

        {recoveredBackup && !showAbortConfirm && (
          <button
            onClick={() => setShowAbortConfirm(true)}
            className="w-full text-center text-xs text-red-400 hover:text-red-300 transition-colors mt-2 py-1"
          >
            Abort session
          </button>
        )}

        {recoveredBackup && showAbortConfirm && (
          <div className="mt-2 border border-red-400/30 rounded-lg p-3 space-y-2">
            <p className="text-xs text-muted text-center">Discard the unfinished session?</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem("gym-guided-backup");
                  setRecoveredBackup(null);
                  setShowAbortConfirm(false);
                  setSelectedDay(null);
                }}
                className="flex-1 h-9 border border-red-400/50 text-red-400 text-xs rounded hover:border-red-400 transition-colors"
              >
                Yes, discard
              </button>
              <button
                onClick={() => setShowAbortConfirm(false)}
                className="flex-1 h-9 border border-border text-muted text-xs rounded hover:border-accent hover:text-accent transition-colors"
              >
                Keep it
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Load Up ── */}
      {overloadHighlights.length > 0 && (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-3">Load up</p>
          <div>
            {overloadHighlights.map(({ name, dayLabel, status, suggestedWeight, lastWeight }) => (
              <div key={name} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-[11px] text-muted">{dayLabel}</p>
                </div>
                <div className="text-right">
                  {status === "go_up" ? (
                    <p className="text-sm font-medium">
                      <span className="text-muted">{kgToDisplay(lastWeight, unit)}</span>
                      <span className="text-muted mx-1">→</span>
                      <span className="text-accent">{kgToDisplay(suggestedWeight, unit)} {unit}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted font-medium">
                      {kgToDisplay(lastWeight, unit)} {unit}
                    </p>
                  )}
                  <p className={`text-[11px] ${status === "go_up" ? "text-accent" : "text-muted"}`}>
                    {status === "go_up" ? "ready to go up" : "almost there"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
    </>
  );
}
