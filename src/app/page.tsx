"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import {
  isBiometricSupported,
  isBiometricEnrolled,
  registerBiometric,
  disableBiometric,
} from "@/lib/webauthn";

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

const DAY_ORDER_KEY = (planId: string) => `gym-day-order-${planId}`;

function getNextDayType(
  lastDayType: string | undefined,
  dayKeys: string[]
): string {
  if (!lastDayType || dayKeys.length === 0) return dayKeys[0];
  const lastIdx = dayKeys.indexOf(lastDayType);
  if (lastIdx === -1) return dayKeys[0];
  return dayKeys[(lastIdx + 1) % dayKeys.length];
}

function validateDayOrder(
  order: string[],
  defaultKeys: string[]
): string[] | null {
  if (
    order.length === defaultKeys.length &&
    defaultKeys.every((k) => order.includes(k))
  ) {
    return order;
  }
  return null;
}

function getSavedDayOrder(
  planId: string,
  defaultKeys: string[],
  dbDayOrder?: Record<string, string[]>
): string[] {
  if (dbDayOrder && dbDayOrder[planId]) {
    const valid = validateDayOrder(dbDayOrder[planId], defaultKeys);
    if (valid) return valid;
  }
  if (typeof window === "undefined") return defaultKeys;
  try {
    const saved = localStorage.getItem(DAY_ORDER_KEY(planId));
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      const valid = validateDayOrder(parsed, defaultKeys);
      if (valid) return valid;
    }
  } catch {}
  return defaultKeys;
}

interface Preferences {
  dayOrder?: Record<string, string[]>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
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
  const { data: prefs, mutate: mutatePrefs } = useSWR<Preferences>(
    "/api/preferences",
    fetcher
  );

  const defaultKeys = Object.keys(plan.days);
  const [dayKeys, setDayKeys] = useState<string[]>(() =>
    getSavedDayOrder(plan.id, defaultKeys)
  );

  useEffect(() => {
    setDayKeys(
      getSavedDayOrder(
        plan.id,
        Object.keys(plan.days),
        prefs?.dayOrder as Record<string, string[]> | undefined
      )
    );
  }, [plan, prefs]);

  const streak = sessions ? calculateStreak(sessions) : 0;
  const lastSession = sessions?.[0];
  const nextDayType = getNextDayType(lastSession?.dayType, dayKeys);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const effectiveSelected = selectedDay || nextDayType;

  // Muscle group radar data (current week)
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

  // Sessions with volume for StreakCalendar
  const sessionsWithVolume = useMemo(() => {
    if (!sessions) return [];
    return sessions.map((s) => ({
      date: s.date,
      dayType: s.dayType,
      totalVolume: s.totalVolume,
    }));
  }, [sessions]);

  // ── Drag-to-reorder state ──────────────────────────────────────────────
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragIdxRef = useRef<number | null>(null);
  const overIdxRef = useRef<number | null>(null);

  // ── Biometric state ────────────────────────────────────────────────────
  const [bioEnabled, setBioEnabled] = useState<boolean | null>(null);
  const [bioSupported, setBioSupported] = useState(false);
  const [bioConfirm, setBioConfirm] = useState(false);
  const [bioPin, setBioPin] = useState("");
  const [bioBusy, setBioBusy] = useState(false);
  const [bioError, setBioError] = useState("");

  useEffect(() => {
    isBiometricSupported().then(setBioSupported);
    isBiometricEnrolled().then(setBioEnabled);
  }, []);

  async function handleBioToggle() {
    if (bioEnabled) {
      setBioConfirm(true);
      setBioError("");
    } else {
      setBioBusy(true);
      const ok = await registerBiometric();
      setBioBusy(false);
      if (ok) setBioEnabled(true);
    }
  }

  async function confirmDisableBio() {
    setBioBusy(true);
    setBioError("");
    const ok = await disableBiometric(bioPin);
    setBioBusy(false);
    if (ok) {
      setBioEnabled(false);
      setBioConfirm(false);
      setBioPin("");
    } else {
      setBioError("Wrong PIN");
    }
  }

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  function startDrag(idx: number) {
    isDraggingRef.current = true;
    dragIdxRef.current = idx;
    overIdxRef.current = idx;
    setDragIdx(idx);
    setOverIdx(idx);
    if (navigator.vibrate) navigator.vibrate(30);
  }

  function finishDrag() {
    clearHold();
    const d = dragIdxRef.current;
    const o = overIdxRef.current;
    if (d !== null && o !== null && d !== o) {
      setDayKeys((prev) => {
        const newKeys = [...prev];
        const [removed] = newKeys.splice(d, 1);
        newKeys.splice(o, 0, removed);
        localStorage.setItem(DAY_ORDER_KEY(plan.id), JSON.stringify(newKeys));
        const updatedDayOrder = {
          ...((prefs?.dayOrder as Record<string, string[]>) || {}),
          [plan.id]: newKeys,
        };
        fetch("/api/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dayOrder: updatedDayOrder }),
        });
        mutatePrefs({ ...prefs, dayOrder: updatedDayOrder }, false);
        return newKeys;
      });
    }
    isDraggingRef.current = false;
    dragIdxRef.current = null;
    overIdxRef.current = null;
    setDragIdx(null);
    setOverIdx(null);
  }

  function handleTouchStart(idx: number, e: React.TouchEvent) {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    clearHold();
    holdTimerRef.current = setTimeout(() => startDrag(idx), 400);
  }

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!isDraggingRef.current) {
        if (Math.abs(touch.clientY - touchStartY.current) > 10) {
          clearHold();
        }
        return;
      }
      e.preventDefault();
      const y = touch.clientY;
      for (let i = 0; i < cardRefs.current.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) {
          overIdxRef.current = i;
          setOverIdx(i);
          break;
        }
      }
    }

    grid.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => grid.removeEventListener("touchmove", onTouchMove);
  }, [clearHold]);

  function handleMouseDown(idx: number, e: React.MouseEvent) {
    if (e.button !== 0) return;
    touchStartY.current = e.clientY;
    clearHold();
    holdTimerRef.current = setTimeout(() => startDrag(idx), 400);
  }

  const displayKeys = (() => {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx)
      return dayKeys;
    const preview = [...dayKeys];
    const [removed] = preview.splice(dragIdx, 1);
    preview.splice(overIdx, 0, removed);
    return preview;
  })();

  return (
    <div className="space-y-6">
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

      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-sm hover:border-accent transition-colors"
            aria-label="Toggle theme"
            title={
              theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          {bioSupported && bioEnabled !== null && (
            <button
              onClick={handleBioToggle}
              disabled={bioBusy}
              className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm transition-colors disabled:opacity-50 ${
                bioEnabled
                  ? "border-accent text-accent"
                  : "border-border text-muted hover:border-accent"
              }`}
              aria-label={
                bioEnabled
                  ? "Disable biometric login"
                  : "Enable biometric login"
              }
              title={
                bioEnabled
                  ? "Biometric login enabled"
                  : "Enable biometric login"
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold">{streak}</span>
          <span className="text-muted text-sm ml-1">week streak</span>
        </div>
      </div>

      {/* ── Last Session ── */}
      {lastSession && (
        <div>
          <h2 className="text-lg font-medium mb-3">Last Session</h2>
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
        <h2 className="text-lg font-medium mb-3">Up Next</h2>
        <div className="text-muted text-[10px] mb-2">
          Tap to select &middot; hold &amp; drag to reorder
        </div>
        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-2"
          onTouchEnd={finishDrag}
          onTouchCancel={finishDrag}
          onMouseUp={finishDrag}
        >
          {displayKeys.map((key, i) => {
            const day = plan.days[key];
            if (!day) return null;
            const isSelected = key === effectiveSelected;
            const isNext = key === nextDayType;
            const isDragging = dragIdx !== null;
            const isBeingDragged = isDragging && dayKeys[dragIdx] === key;
            const realIdx = dayKeys.indexOf(key);

            return (
              <div
                key={key}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                onTouchStart={(e) => handleTouchStart(realIdx, e)}
                onMouseDown={(e) => handleMouseDown(realIdx, e)}
                onContextMenu={(e) => e.preventDefault()}
                className={`select-none transition-all duration-150 ${
                  isBeingDragged ? "opacity-60 scale-[0.97]" : ""
                }`}
                style={
                  { WebkitTouchCallout: "none" } as React.CSSProperties
                }
              >
                <button
                  onClick={(e) => {
                    if (isDragging) return;
                    setSelectedDay(key);
                  }}
                  className={`w-full text-left block border rounded p-3 transition-colors text-sm ${
                    isSelected
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-muted"
                  } ${isSelected ? "animate-pulse-border" : ""}`}
                  draggable={false}
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
              </div>
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
        <h2 className="text-lg font-medium mb-3">Progress</h2>

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

      {/* Biometric disable confirmation */}
      {bioConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bg/90">
          <div className="bg-surface border border-border rounded-lg p-6 max-w-xs w-full mx-4 text-center">
            <h2 className="text-sm font-medium mb-2">
              Disable biometric login?
            </h2>
            <p className="text-muted text-xs mb-4">
              Enter your PIN to confirm
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={bioPin}
              onChange={(e) => {
                setBioPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                setBioError("");
              }}
              placeholder="PIN"
              className="w-full h-10 bg-bg border border-border text-text text-center text-lg rounded mb-2 focus:border-accent focus:outline-none"
              autoFocus
            />
            {bioError && (
              <p className="text-red-500 text-xs mb-2">{bioError}</p>
            )}
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => {
                  setBioConfirm(false);
                  setBioPin("");
                  setBioError("");
                }}
                className="flex-1 h-10 border border-border text-muted rounded text-sm hover:text-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisableBio}
                disabled={bioPin.length < 4 || bioBusy}
                className="flex-1 h-10 bg-red-500 text-white font-medium rounded text-sm hover:bg-red-400 disabled:opacity-50 transition-colors"
              >
                {bioBusy ? "..." : "Disable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
