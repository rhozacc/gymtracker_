"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface RestTimerProps {
  seconds: number;
  onDismiss: () => void;
}

export function RestTimer({ seconds, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [flash, setFlash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Try to keep screen awake
    let wakeLock: WakeLockSentinel | null = null;
    (async () => {
      try {
        wakeLock = await navigator.wakeLock.request("screen");
      } catch {
        // Wake Lock not supported or failed — degrade gracefully
      }
    })();
    return () => {
      wakeLock?.release();
    };
  }, []);

  useEffect(() => {
    if (remaining <= 0) {
      setFlash(true);
      const t1 = setTimeout(() => setFlash(false), 400);
      const t2 = setTimeout(() => setFlash(true), 600);
      const t3 = setTimeout(() => setFlash(false), 1000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
    const interval = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining]);

  if (!mounted) return null;

  const progress = Math.min(1, 1 - remaining / seconds);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const mins = Math.floor(Math.max(0, remaining) / 60);
  const secs = Math.max(0, remaining) % 60;
  const display = `${mins}:${secs.toString().padStart(2, "0")}`;
  const done = remaining <= 0;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center transition-colors duration-200 ${
        flash ? "bg-white" : "bg-bg/95"
      }`}
    >
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
          stroke={done ? "#22c55e" : "var(--color-accent)"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 100 100)"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* Big countdown */}
      <div
        className={`text-7xl font-bold tabular-nums ${
          done ? "text-green-400" : flash ? "text-bg" : "text-accent"
        }`}
      >
        {done ? "GO" : display}
      </div>

      <p className={`text-sm mt-2 ${flash ? "text-bg/60" : "text-muted"}`}>
        {done ? "Time to lift" : "Rest"}
      </p>

      <button
        onClick={onDismiss}
        className={`mt-10 px-8 py-3 border rounded text-sm transition-colors ${
          flash
            ? "border-bg/30 text-bg/60"
            : "border-border text-muted hover:text-accent hover:border-muted"
        }`}
      >
        {done ? "Close" : "Skip"}
      </button>
    </div>,
    document.body
  );
}
