"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  type ExtraOption,
  type ExtraExercise,
  CATEGORY_INFO,
  formatExtraValue,
} from "@/lib/extras";
import { useBeep } from "@/lib/useBeep";

interface ExtrasSessionProps {
  extras: ExtraOption[];
  onFinish: () => void;
  onSkip: () => void;
}

// ─── Countdown timer for time-based exercises ────────────────────

function ExerciseTimer({
  seconds,
  onDone,
}: {
  seconds: number;
  onDone: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const endTimeRef = useRef<number>(Date.now() + seconds * 1000);
  const firedRef = useRef(false);
  const { playBeep } = useBeep();

  useEffect(() => {
    endTimeRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    firedRef.current = false;
  }, [seconds]);

  useEffect(() => {
    function tick() {
      const rem = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0 && !firedRef.current) {
        firedRef.current = true;
        playBeep();
        // Small delay so beep is audible before advancing
        setTimeout(onDone, 400);
      }
    }

    tick();
    const interval = setInterval(tick, 250);

    function handleVisibility() {
      if (!document.hidden) tick();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [seconds, onDone, playBeep]);

  const progress = Math.min(1, 1 - remaining / seconds);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center">
      <svg className="w-44 h-44 mb-4" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--color-timer-track)" strokeWidth="5" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 80 80)"
          className="transition-all duration-300 ease-linear"
        />
      </svg>
      <div className="text-5xl font-bold tabular-nums text-accent">{display}</div>
    </div>
  );
}

// ─── Rest countdown between exercises ────────────────────────────

function RestCountdown({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const endTimeRef = useRef<number>(Date.now() + seconds * 1000);
  const firedRef = useRef(false);

  useEffect(() => {
    function tick() {
      const rem = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0 && !firedRef.current) {
        firedRef.current = true;
        onDone();
      }
    }
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [seconds, onDone]);

  return (
    <div className="text-center">
      <p className="text-muted text-sm mb-2">Rest</p>
      <div className="text-3xl font-bold tabular-nums text-accent">{remaining}s</div>
    </div>
  );
}

// ─── Main ExtrasSession component ────────────────────────────────

export function ExtrasSession({ extras, onFinish, onSkip }: ExtrasSessionProps) {
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [phase, setPhase] = useState<"exercise" | "rest" | "transition">("transition");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentExtra = extras[categoryIdx];
  const currentExercise: ExtraExercise | undefined = currentExtra?.exercises[exerciseIdx];
  const totalCategories = extras.length;

  const advanceToNext = useCallback(() => {
    if (!currentExtra) {
      onFinish();
      return;
    }

    const nextExIdx = exerciseIdx + 1;
    if (nextExIdx < currentExtra.exercises.length) {
      // Next exercise in same category
      const restTime = currentExtra.exercises[exerciseIdx]?.rest ?? 0;
      if (restTime > 0) {
        setExerciseIdx(nextExIdx);
        setPhase("rest");
      } else {
        setExerciseIdx(nextExIdx);
        setPhase("exercise");
      }
    } else {
      // Category done — move to next or finish
      const nextCatIdx = categoryIdx + 1;
      if (nextCatIdx < extras.length) {
        setCategoryIdx(nextCatIdx);
        setExerciseIdx(0);
        setPhase("transition");
      } else {
        onFinish();
      }
    }
  }, [categoryIdx, exerciseIdx, currentExtra, extras, onFinish]);

  const handleSkipCategory = useCallback(() => {
    const nextCatIdx = categoryIdx + 1;
    if (nextCatIdx < extras.length) {
      setCategoryIdx(nextCatIdx);
      setExerciseIdx(0);
      setPhase("transition");
    } else {
      onFinish();
    }
  }, [categoryIdx, extras.length, onFinish]);

  if (!mounted) return null;

  // ─── Transition screen between categories ──────────────────────
  if (phase === "transition") {
    const cat = currentExtra;
    if (!cat) {
      onFinish();
      return null;
    }

    const catInfo = CATEGORY_INFO[cat.category];

    return createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg/95 px-6">
        <p className="text-muted text-xs uppercase tracking-wide mb-2">
          {categoryIdx === 0 ? "Starting extras" : "Up next"}
          {totalCategories > 1 && (
            <span className="ml-2">{categoryIdx + 1}/{totalCategories}</span>
          )}
        </p>
        <h2 className="text-2xl font-bold text-accent mb-1">{catInfo.label}</h2>
        <p className="text-muted text-sm mb-1">{cat.name}</p>
        <p className="text-muted text-xs mb-8">
          {cat.exercises.length} exercises · {cat.duration}
        </p>

        <button
          onClick={() => setPhase("exercise")}
          className="w-48 h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity mb-3"
        >
          Let&apos;s go
        </button>
        <button
          onClick={handleSkipCategory}
          className="mt-3 px-4 py-1.5 border border-border text-muted text-sm rounded hover:border-accent hover:text-accent transition-colors"
        >
          Skip {catInfo.label.toLowerCase()}
        </button>
        <button
          onClick={onSkip}
          className="mt-3 px-4 py-1.5 border border-red-400 text-red-400 text-sm rounded hover:bg-red-400/10 transition-colors"
        >
          End extras
        </button>
      </div>,
      document.body
    );
  }

  // ─── Rest screen ───────────────────────────────────────────────
  if (phase === "rest") {
    const restTime = currentExtra?.exercises[exerciseIdx - 1]?.rest ?? 10;
    return createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg/95">
        <RestCountdown seconds={restTime} onDone={() => setPhase("exercise")} />
        <button
          onClick={() => setPhase("exercise")}
          className="mt-6 px-6 py-2 border border-border text-muted rounded text-sm hover:text-accent hover:border-muted transition-colors"
        >
          Skip
        </button>
      </div>,
      document.body
    );
  }

  // ─── Exercise screen ───────────────────────────────────────────
  if (!currentExercise || !currentExtra) {
    onFinish();
    return null;
  }

  const catInfo = CATEGORY_INFO[currentExtra.category];
  const exNumber = exerciseIdx + 1;
  const exTotal = currentExtra.exercises.length;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg/95 px-6">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-muted text-xs uppercase tracking-wide mb-1">
          {catInfo.label} · {exNumber}/{exTotal}
        </p>
        <h2 className="text-xl font-bold text-foreground">{currentExercise.name}</h2>
      </div>

      {/* Timer or reps display */}
      {currentExercise.mode === "time" ? (
        <ExerciseTimer
          key={currentExercise.id}
          seconds={currentExercise.value}
          onDone={advanceToNext}
        />
      ) : (
        <div className="flex flex-col items-center">
          <div className="text-6xl font-bold text-accent mb-2">
            {currentExercise.value}
          </div>
          <p className="text-muted text-sm">reps</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-10 flex flex-col items-center gap-3">
        {currentExercise.mode === "reps" && (
          <button
            onClick={advanceToNext}
            className="w-48 h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        )}
        {currentExercise.mode === "time" && (
          <button
            onClick={advanceToNext}
            className="px-6 py-2 border border-border text-muted rounded text-sm hover:text-accent hover:border-muted transition-colors"
          >
            Skip
          </button>
        )}
        <button
          onClick={handleSkipCategory}
          className="mt-3 px-4 py-1.5 border border-border text-muted text-sm rounded hover:border-accent hover:text-accent transition-colors"
        >
          Skip {catInfo.label.toLowerCase()}
        </button>
      </div>
    </div>,
    document.body
  );
}
