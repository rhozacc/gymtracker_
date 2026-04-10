"use client";

import { useState, useEffect, useCallback } from "react";
import type { ExtraOption } from "@/lib/extras";
import { TransitionView, RestView, ExerciseView } from "./ExtrasSessionViews";

interface ExtrasSessionProps {
  extras: ExtraOption[];
  onFinish: () => void;
  onSkip: () => void;
}

export function ExtrasSession({ extras, onFinish, onSkip }: ExtrasSessionProps) {
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [phase, setPhase] = useState<"exercise" | "rest" | "transition">("transition");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentExtra = extras[categoryIdx];
  const currentExercise = currentExtra?.exercises[exerciseIdx];

  const advanceToNext = useCallback(() => {
    if (!currentExtra) {
      onFinish();
      return;
    }

    const nextExIdx = exerciseIdx + 1;
    if (nextExIdx < currentExtra.exercises.length) {
      const restTime = currentExtra.exercises[exerciseIdx]?.rest ?? 0;
      if (restTime > 0) {
        setExerciseIdx(nextExIdx);
        setPhase("rest");
      } else {
        setExerciseIdx(nextExIdx);
        setPhase("exercise");
      }
    } else {
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

  if (phase === "transition") {
    if (!currentExtra) {
      onFinish();
      return null;
    }
    return (
      <TransitionView
        currentExtra={currentExtra}
        categoryIdx={categoryIdx}
        totalCategories={extras.length}
        onStart={() => setPhase("exercise")}
        onSkipCategory={handleSkipCategory}
        onSkipAll={onSkip}
      />
    );
  }

  if (phase === "rest") {
    const restTime = currentExtra?.exercises[exerciseIdx - 1]?.rest ?? 10;
    return (
      <RestView
        restSeconds={restTime}
        onDone={() => setPhase("exercise")}
        onSkip={() => setPhase("exercise")}
      />
    );
  }

  if (!currentExercise || !currentExtra) {
    onFinish();
    return null;
  }

  return (
    <ExerciseView
      currentExercise={currentExercise}
      currentExtra={currentExtra}
      exerciseIdx={exerciseIdx}
      onDone={advanceToNext}
      onSkipCategory={handleSkipCategory}
    />
  );
}
