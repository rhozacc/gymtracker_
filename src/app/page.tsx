"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { fetcher } from "@/lib/swr";
import { getDayLabel, PlanDefinition } from "@/lib/program";
import { useProgram } from "@/lib/useProgram";
import { useUnit } from "@/lib/useUnit";
import { useTheme } from "@/lib/useTheme";
import { kgToDisplay } from "@/lib/units";
import { calculateStreak, formatDate } from "@/lib/utils";
import { StreakCalendar } from "@/components/StreakCalendar";
import {
  isBiometricSupported,
  isBiometricEnrolled,
  registerBiometric,
  disableBiometric,
} from "@/lib/webauthn";

const VolumeChart = dynamic(
  () => import("@/components/VolumeChart").then((m) => m.VolumeChartInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] bg-surface rounded animate-pulse" />
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

function getSavedDayOrder(planId: string, defaultKeys: string[]): string[] {
  if (typeof window === "undefined") return defaultKeys;
  try {
    const saved = localStorage.getItem(DAY_ORDER_KEY(planId));
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      // Validate: must have same keys
      if (
        parsed.length === defaultKeys.length &&
        defaultKeys.every((k) => parsed.includes(k))
      ) {
        return parsed;
      }
    }
  } catch {}
  return defaultKeys;
}

export default function Dashboard() {
  const { plan } = useProgram();
  const { unit } = useUnit();
  const { theme, toggleTheme } = useTheme();
  const { data: sessions, error: sessionsError } =
    useSWR<SessionSummary[]>("/api/sessions", fetcher);
  const { data: volumeData } = useSWR("/api/volume/weekly", fetcher);

  const defaultKeys = Object.keys(plan.days);
  const [dayKeys, setDayKeys] = useState<string[]>(() =>
    getSavedDayOrder(plan.id, defaultKeys)
  );

  // Sync day keys when plan changes
  useEffect(() => {
    setDayKeys(getSavedDayOrder(plan.id, Object.keys(plan.days)));
  }, [plan]);

  const streak = sessions ? calculateStreak(sessions) : 0;
  const lastSession = sessions?.[0];
  const nextDayType = getNextDayType(lastSession?.dayType, dayKeys);

  // ── Drag-to-reorder state ──────────────────────────────────────────────
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  // Keep drag/over state in refs so non-passive touchmove handler sees latest values
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

  // Attach touchmove as NON-PASSIVE so preventDefault() actually stops scroll on iOS
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
      e.preventDefault(); // works because { passive: false }
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

  // Also support mouse drag for desktop
  function handleMouseDown(idx: number, e: React.MouseEvent) {
    if (e.button !== 0) return;
    touchStartY.current = e.clientY;
    clearHold();
    holdTimerRef.current = setTimeout(() => startDrag(idx), 400);
  }

  // Compute visual order for rendering (preview the reorder while dragging)
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
          {/* Theme toggle - upper left */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-sm hover:border-accent transition-colors"
            aria-label="Toggle theme"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          {/* Biometric toggle */}
          {bioSupported && bioEnabled !== null && (
            <button
              onClick={handleBioToggle}
              disabled={bioBusy}
              className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm transition-colors disabled:opacity-50 ${
                bioEnabled
                  ? "border-accent text-accent"
                  : "border-border text-muted hover:border-accent"
              }`}
              aria-label={bioEnabled ? "Disable biometric login" : "Enable biometric login"}
              title={bioEnabled ? "Biometric login enabled" : "Enable biometric login"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {sessions && sessions.length > 0 && (
        <StreakCalendar sessions={sessions} />
      )}

      {lastSession && (
        <Link
          href={`/history/${lastSession.id}`}
          className="block border border-border rounded p-3 hover:border-muted transition-colors"
        >
          <div className="text-muted text-xs mb-1">Last session</div>
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
      )}

      <div>
        <div className="text-muted text-xs mb-3">
          Start session{" "}
          <span className="text-muted/50">— hold &amp; drag to reorder</span>
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
            const isNext = key === nextDayType;
            const isDragging = dragIdx !== null;
            const isBeingDragged =
              isDragging && dayKeys[dragIdx] === key;
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
                  isBeingDragged
                    ? "opacity-60 scale-[0.97]"
                    : ""
                }`}
                style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
              >
                <Link
                  href={`/log/${key}`}
                  className={`block border rounded p-3 transition-colors text-sm ${
                    isNext
                      ? "border-accent animate-pulse-border"
                      : "border-border hover:border-muted"
                  }`}
                  draggable={false}
                  onClick={(e) => {
                    if (isDragging) e.preventDefault();
                  }}
                >
                  {day.label}
                  <span className="text-muted ml-2 text-xs">
                    {day.exercises.length} exercises
                  </span>
                  {isNext && (
                    <span className="text-accent text-xs ml-2 font-medium">
                      Next up
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-muted text-xs mb-3">
          Weekly volume (last 16 weeks)
        </div>
        {volumeData && volumeData.length > 0 ? (
          <VolumeChart data={volumeData} unit={unit} />
        ) : (
          <div className="text-muted text-sm text-center py-8 border border-border rounded">
            No data yet. Log your first session!
          </div>
        )}
      </div>

      {/* Biometric disable confirmation */}
      {bioConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bg/90">
          <div className="bg-surface border border-border rounded-lg p-6 max-w-xs w-full mx-4 text-center">
            <h2 className="text-sm font-medium mb-2">Disable biometric login?</h2>
            <p className="text-muted text-xs mb-4">Enter your PIN to confirm</p>
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
            {bioError && <p className="text-red-500 text-xs mb-2">{bioError}</p>}
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => { setBioConfirm(false); setBioPin(""); setBioError(""); }}
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
