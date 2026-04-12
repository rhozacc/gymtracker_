"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface NextExerciseInfo {
  name: string;
  weight: string;
  reps: string;
  setNumber: number;
  totalSets: number;
}

interface RestTimerProps {
  seconds: number;
  onDismiss: () => void;
  onTimerEnd?: () => void;
  nextExercise?: NextExerciseInfo;
}

export function RestTimer({ seconds, onDismiss, onTimerEnd, nextExercise }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [mounted, setMounted] = useState(false);
  const timerEndFired = useRef(false);

  // Use refs for callbacks so the interval closure always calls the latest version
  const onTimerEndRef = useRef(onTimerEnd);
  onTimerEndRef.current = onTimerEnd;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Store the absolute end time so the countdown stays accurate when tab is hidden
  const endTimeRef = useRef<number>(Date.now() + seconds * 1000);

  useEffect(() => {
    setMounted(true);

    // Wake lock to prevent screen sleep
    let wakeLock: WakeLockSentinel | null = null;
    (async () => {
      try {
        wakeLock = await navigator.wakeLock.request("screen");
      } catch {
        // Degrade gracefully if not supported
      }
    })();

    const autoDismissRef = { current: null as ReturnType<typeof setTimeout> | null };

    function checkTimer() {
      const rem = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemaining(rem);

      if (rem <= 0 && !timerEndFired.current) {
        timerEndFired.current = true;
        onTimerEndRef.current?.();
        // Auto-dismiss after 600 ms (enough for beep to start)
        autoDismissRef.current = setTimeout(() => {
          onDismissRef.current();
        }, 600);
      }
    }

    // Poll every 250 ms for smooth display; also fires immediately to set initial state
    checkTimer();
    const interval = setInterval(checkTimer, 250);

    // Re-check immediately when user returns to tab
    function handleVisibilityChange() {
      if (!document.hidden) {
        checkTimer();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLock?.release();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  const progress = Math.min(1, 1 - remaining / seconds);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins}:${secs.toString().padStart(2, "0")}`;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg">
      {/* Circular progress */}
      <svg className="w-56 h-56 mb-6" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--color-timer-track)"
          strokeWidth="6"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 100 100)"
          className="transition-all duration-300 ease-linear"
          style={remaining > 0 && remaining <= 5 ? {
            filter: "drop-shadow(0 0 8px var(--color-accent))",
          } : undefined}
        />
      </svg>

      {/* Big countdown — pulses urgently when ≤5 s remain */}
      <div
        className={`text-7xl font-bold tabular-nums text-accent ${
          remaining > 0 && remaining <= 5 ? "rest-timer-urgent" : ""
        }`}
      >
        {display}
      </div>

      <p className="text-sm mt-2 text-muted">Rest</p>

      {/* Next exercise — larger font */}
      {nextExercise && (
        <div className="mt-8 text-center px-6">
          <p className="text-muted text-xs uppercase tracking-wide mb-1">Next up</p>
          <p className="text-accent text-xl font-semibold">{nextExercise.name}</p>
          <p className="text-muted text-base mt-1">
            Set {nextExercise.setNumber} of {nextExercise.totalSets}
          </p>
          {nextExercise.weight && (
            <p className="text-accent/70 text-lg mt-0.5">
              {nextExercise.weight} &times; {nextExercise.reps}
            </p>
          )}
        </div>
      )}

      <button
        onClick={onDismiss}
        className="mt-10 px-8 py-3 border border-border text-muted rounded text-sm hover:text-accent hover:border-muted transition-colors"
      >
        Skip
      </button>
    </div>,
    document.body
  );
}
