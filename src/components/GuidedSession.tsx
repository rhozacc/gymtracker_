"use client";

import { useReducer, useCallback, useState, useEffect, useRef } from "react";
import { DayDefinition } from "@/lib/program";
import { OverloadResult } from "@/lib/overload";
import { type WeightUnit } from "@/lib/units";
import { SetInput } from "@/components/SetRow";
import { GuidedExerciseCard } from "@/components/GuidedExerciseCard";
import { useBeep } from "@/lib/useBeep";
import { useBackgroundNotification } from "@/lib/useBackgroundNotification";

interface ExerciseState {
  exerciseId: string;
  sets: SetInput[];
}

interface GuidedSessionProps {
  day: DayDefinition;
  exercises: ExerciseState[];
  overloads: Record<string, OverloadResult>;
  unit: WeightUnit;
  increments: number[];
  updateSet: (exIdx: number, setIdx: number, data: SetInput) => void;
  onFinish: () => void;
  onStop: () => void;
}

interface GuidedState {
  exerciseIndex: number;
  setIndex: number;
}

type GuidedAction =
  | { type: "NEXT_SET"; nextExIdx: number; nextSetIdx: number }
  | { type: "SKIP_EXERCISE"; nextExIdx: number };

function guidedReducer(state: GuidedState, action: GuidedAction): GuidedState {
  switch (action.type) {
    case "NEXT_SET":
      return { exerciseIndex: action.nextExIdx, setIndex: action.nextSetIdx };
    case "SKIP_EXERCISE":
      return { exerciseIndex: action.nextExIdx, setIndex: 0 };
    default:
      return state;
  }
}

export function GuidedSession({
  day,
  exercises,
  overloads,
  unit,
  increments,
  updateSet,
  onFinish,
  onStop,
}: GuidedSessionProps) {
  const [state, dispatch] = useReducer(guidedReducer, {
    exerciseIndex: 0,
    setIndex: 0,
  });

  // Inline rest timer: absolute end timestamp (null = not resting)
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  // Track the duration of the current rest period for the progress fill
  const restDurationRef = useRef(0);

  // Flash states — triggered explicitly from handlers
  const [setFlash, setSetFlash] = useState(false);
  const [exerciseFlash, setExerciseFlash] = useState(false);
  const setFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exerciseFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function triggerSetFlash() {
    if (setFlashTimer.current) clearTimeout(setFlashTimer.current);
    setSetFlash(true);
    setFlashTimer.current = setTimeout(() => setSetFlash(false), 600);
  }

  function triggerExerciseFlash() {
    if (exerciseFlashTimer.current) clearTimeout(exerciseFlashTimer.current);
    setExerciseFlash(true);
    exerciseFlashTimer.current = setTimeout(() => setExerciseFlash(false), 600);
  }

  // Per-exercise name overrides (only for this session)
  const [exerciseNameOverrides, setExerciseNameOverrides] = useState<Record<string, string>>({});

  // Track how many times user has skipped warmup — to offer "Disable Warmups Forever"
  const [skipWarmupCount, setSkipWarmupCount] = useState(0);

  const { playBeep } = useBeep();
  const { notifyIfBackgrounded, startRestTimer, cancelRestTimer } = useBackgroundNotification();

  const currentExercise = day.exercises[state.exerciseIndex];
  const currentExState = exercises[state.exerciseIndex];
  const currentSetData = currentExState?.sets[state.setIndex];

  const currentDisplayName =
    exerciseNameOverrides[currentExercise?.id ?? ""] ?? currentExercise?.name ?? "";

  const getNextInfo = useCallback(() => {
    let nextExIdx = state.exerciseIndex;
    let nextSetIdx = state.setIndex + 1;
    const exSets = exercises[nextExIdx]?.sets;

    if (exSets && nextSetIdx >= exSets.length) {
      nextExIdx++;
      nextSetIdx = 0;
    }

    if (nextExIdx >= day.exercises.length) return null;

    const nextEx = day.exercises[nextExIdx];
    const nextExName = exerciseNameOverrides[nextEx.id] ?? nextEx.name;
    const nextSetData = exercises[nextExIdx]?.sets[nextSetIdx];
    const nextExSets = exercises[nextExIdx]?.sets ?? [];
    const hasWarmup = nextExSets[0]?.isWarmup ?? false;
    const warmupOffset = hasWarmup ? 1 : 0;
    const isNextWarmup = nextExSets[nextSetIdx]?.isWarmup ?? false;
    return {
      exerciseIndex: nextExIdx,
      setIndex: nextSetIdx,
      exercise: nextEx,
      info: {
        name: nextExName,
        weight: nextSetData?.weight || "",
        reps: `${nextEx.repRange[0]}–${nextEx.repRange[1]}`,
        setNumber: isNextWarmup ? 0 : nextSetIdx - warmupOffset + 1,
        totalSets: nextExSets.length > 0 ? nextExSets.length - warmupOffset : nextEx.sets,
      },
    };
  }, [state.exerciseIndex, state.setIndex, day.exercises, exercises, exerciseNameOverrides]);

  // Poll rest timer every 250ms
  useEffect(() => {
    if (restEndsAt === null) {
      setRestRemaining(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRestRemaining(remaining);

      if (remaining === 0) {
        playBeep();
        const next = getNextInfo();
        const nextName = next
          ? (exerciseNameOverrides[next.exercise.id] ?? next.exercise.name)
          : "Next set";
        notifyIfBackgrounded("Rest Complete", `Time to lift! ${nextName}`);
        cancelRestTimer();
        setRestEndsAt(null);
      }
    };

    tick(); // immediate first tick
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [restEndsAt, playBeep, notifyIfBackgrounded, cancelRestTimer, getNextInfo, exerciseNameOverrides]);

  const handleSetDone = useCallback(() => {
    if (!currentSetData) return;
    // Warmup sets don't require reps/weight to be set before marking done
    if (!currentSetData.isWarmup && (!currentSetData.weight || !currentSetData.reps)) return;
    updateSet(state.exerciseIndex, state.setIndex, { ...currentSetData, done: true });

    const isLastExercise = state.exerciseIndex >= day.exercises.length - 1;
    const isLastSet = state.setIndex >= (currentExState?.sets.length ?? 1) - 1;

    if (isLastExercise && isLastSet) {
      onFinish();
      return;
    }

    const next = getNextInfo();
    if (!next) {
      onFinish();
      return;
    }

    // Copy weight forward immediately (same exercise → same weight)
    if (next.exerciseIndex === state.exerciseIndex && currentSetData.weight) {
      const nextSetData = exercises[next.exerciseIndex]?.sets[next.setIndex];
      if (nextSetData) {
        updateSet(next.exerciseIndex, next.setIndex, {
          ...nextSetData,
          weight: currentSetData.weight,
        });
      }
    }

    // Advance to next set immediately
    dispatch({ type: "NEXT_SET", nextExIdx: next.exerciseIndex, nextSetIdx: next.setIndex });
    if (next.exerciseIndex !== state.exerciseIndex) {
      triggerExerciseFlash();
    }
    triggerSetFlash();

    // Start inline rest timer (no rest after warmup — you already rested from the prior exercise)
    const restSecs = currentSetData.isWarmup ? 0 : currentExercise.rest;
    if (restSecs > 0) {
      restDurationRef.current = restSecs;
      setRestEndsAt(Date.now() + restSecs * 1000);
      startRestTimer(restSecs, next.info);
    }
  }, [currentSetData, state.exerciseIndex, state.setIndex, updateSet, day.exercises.length, currentExState, onFinish, currentExercise, getNextInfo, exercises, startRestTimer]);

  const handleSkipRest = useCallback(() => {
    cancelRestTimer();
    setRestEndsAt(null);
  }, [cancelRestTimer]);

  const handleSkipExercise = useCallback(() => {
    // Cancel any running rest when skipping an exercise
    cancelRestTimer();
    setRestEndsAt(null);

    const skipToExIdx = state.exerciseIndex + 1;
    if (skipToExIdx >= day.exercises.length) {
      onFinish();
      return;
    }
    dispatch({ type: "SKIP_EXERCISE", nextExIdx: skipToExIdx });
    triggerSetFlash();
    triggerExerciseFlash();
  }, [state.exerciseIndex, day.exercises.length, onFinish, cancelRestTimer]);

  // Skip just the warmup set — jump straight to the first working set (index 1)
  const handleSkipWarmup = useCallback(() => {
    cancelRestTimer();
    setRestEndsAt(null);
    setSkipWarmupCount((n) => n + 1);
    dispatch({ type: "NEXT_SET", nextExIdx: state.exerciseIndex, nextSetIdx: 1 });
    triggerSetFlash();
  }, [state.exerciseIndex, cancelRestTimer]);

  function handleDisableWarmups() {
    localStorage.setItem("gym-disable-warmups", "true");
  }

  // Safety: if state is inconsistent, finish the session
  if (!currentExercise || !currentExState || !currentSetData) {
    onFinish();
    return null;
  }

  return (
    <GuidedExerciseCard
      key={state.exerciseIndex}
      exercise={currentExercise}
      exerciseName={currentDisplayName}
      exerciseIndex={state.exerciseIndex}
      totalExercises={day.exercises.length}
      setIndex={state.setIndex}
      totalSets={currentExState.sets.length}
      setData={currentSetData}
      overload={overloads[currentExercise.id]}
      unit={unit}
      increments={increments}
      restRemaining={restRemaining}
      restDuration={restDurationRef.current}
      setFlash={setFlash}
      exerciseFlash={exerciseFlash}
      onChange={(data) => updateSet(state.exerciseIndex, state.setIndex, data)}
      onDone={handleSetDone}
      onSkipRest={handleSkipRest}
      onSkip={handleSkipExercise}
      onSkipWarmup={handleSkipWarmup}
      onDisableWarmups={handleDisableWarmups}
      skipWarmupCount={skipWarmupCount}
      onStop={onStop}
      onNameChange={(name) =>
        setExerciseNameOverrides((prev) => ({ ...prev, [currentExercise.id]: name }))
      }
    />
  );
}
