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

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  // Use touch events for iOS compatibility (pointer events trigger iOS callout)
  function handleTouchStart(idx: number, e: React.TouchEvent) {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    clearHold();
    holdTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      setDragIdx(idx);
      setOverIdx(idx);
      if (navigator.vibrate) navigator.vibrate(30);
    }, 400);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!isDraggingRef.current) {
      // Cancel hold if finger moves too much before hold completes
      if (Math.abs(touch.clientY - touchStartY.current) > 10) {
        clearHold();
      }
      return;
    }
    // Prevent scroll while dragging
    e.preventDefault();
    const y = touch.clientY;
    for (let i = 0; i < cardRefs.current.length; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        setOverIdx(i);
        break;
      }
    }
  }

  function handleTouchEnd() {
    clearHold();
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const newKeys = [...dayKeys];
      const [removed] = newKeys.splice(dragIdx, 1);
      newKeys.splice(overIdx, 0, removed);
      setDayKeys(newKeys);
      localStorage.setItem(DAY_ORDER_KEY(plan.id), JSON.stringify(newKeys));
    }
    isDraggingRef.current = false;
    setDragIdx(null);
    setOverIdx(null);
  }

  // Also support mouse drag for desktop
  function handleMouseDown(idx: number, e: React.MouseEvent) {
    if (e.button !== 0) return;
    touchStartY.current = e.clientY;
    clearHold();
    holdTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
      setDragIdx(idx);
      setOverIdx(idx);
    }, 400);
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
          <div>
            <h1 className="text-xl font-medium">Gym Tracker</h1>
            <span className="text-muted text-xs">{plan.name}</span>
          </div>
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
          className="grid grid-cols-1 gap-2"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseUp={handleTouchEnd}
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
    </div>
  );
}
