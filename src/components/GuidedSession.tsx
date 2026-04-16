"use client";

import { useReducer, useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DayDefinition, getAlternatives, type ExerciseAlternative } from "@/lib/program";
import { OverloadResult } from "@/lib/overload";
import { type WeightUnit, kgToDisplay } from "@/lib/units";
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
  initialPosition?: { exerciseIndex: number; setIndex: number };
  initialRestEndsAt?: number | null;
  initialRestDuration?: number;
  updateSet: (exIdx: number, setIdx: number, data: SetInput) => void;
  onFinish: () => void;
  onStop: () => void;
  onAddSet?: (exIdx: number) => void;
  onPositionChange?: (exerciseIndex: number, setIndex: number) => void;
  onSwitchAlternative?: (exIdx: number, alt: ExerciseAlternative) => void;
  onRestStart?: (endsAt: number, duration: number) => void;
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
  initialPosition,
  initialRestEndsAt,
  initialRestDuration,
  updateSet,
  onFinish,
  onStop,
  onAddSet,
  onPositionChange,
  onSwitchAlternative,
  onRestStart,
}: GuidedSessionProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(guidedReducer, {
    exerciseIndex: initialPosition?.exerciseIndex ?? 0,
    setIndex: initialPosition?.setIndex ?? 0,
  });

  // Inline rest timer: absolute end timestamp (null = not resting)
  const [restEndsAt, setRestEndsAt] = useState<number | null>(initialRestEndsAt ?? null);
  const [restRemaining, setRestRemaining] = useState(0);
  // Track the duration of the current rest period for the progress fill
  const restDurationRef = useRef(initialRestDuration ?? 0);

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

  // Report position changes to parent so it can restore position on remount
  useEffect(() => {
    onPositionChange?.(state.exerciseIndex, state.setIndex);
  }, [state.exerciseIndex, state.setIndex, onPositionChange]);

  // Per-exercise name overrides (only for this session)
  const [exerciseNameOverrides, setExerciseNameOverrides] = useState<Record<string, string>>({});

  // Track how many times user has skipped warmup — to offer "Disable Warmups Forever"
  const [skipWarmupCount, setSkipWarmupCount] = useState(0);

  // Intra-session weight recommendation for the next set (same exercise only)
  const [setRec, setSetRec] = useState<{ direction: "up" | "down"; suggestedWeight: string } | null>(null);

  const { playBeep, initAudio } = useBeep();
  const { startRestTimer, cancelRestTimer } = useBackgroundNotification();

  const currentExercise = day.exercises[state.exerciseIndex];
  const currentExState = exercises[state.exerciseIndex];
  const currentSetData = currentExState?.sets[state.setIndex];

  // The exerciseId in state might be an alternative (different from day.exercises[i].id)
  const activeExerciseId = currentExState?.exerciseId ?? currentExercise?.id ?? "";

  const currentAlternatives = currentExercise
    ? getAlternatives(currentExercise.id)
    : [];

  // Manual rename > alternative name > original name
  const currentDisplayName = (() => {
    const override = exerciseNameOverrides[currentExercise?.id ?? ""];
    if (override) return override;
    if (activeExerciseId && activeExerciseId !== currentExercise?.id) {
      const altName = currentAlternatives.find((a) => a.id === activeExerciseId)?.name;
      if (altName) return altName;
    }
    return currentExercise?.name ?? "";
  })();

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
        // SW timer handles the "Rest Complete" notification when app is backgrounded
        cancelRestTimer();
        setRestEndsAt(null);
      }
    };

    tick(); // immediate first tick
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [restEndsAt, playBeep, cancelRestTimer]);

  const handleSetDone = useCallback(() => {
    if (!currentSetData) return;
    // Warmup sets don't require reps/weight to be set before marking done
    if (!currentSetData.isWarmup && (!currentSetData.weight || !currentSetData.reps)) return;
    // Prime AudioContext during this user gesture so beep works when rest ends
    initAudio();
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

    // Copy weight forward immediately (same exercise → same weight, but not from warmup)
    if (!currentSetData.isWarmup && next.exerciseIndex === state.exerciseIndex && currentSetData.weight) {
      const nextSetData = exercises[next.exerciseIndex]?.sets[next.setIndex];
      if (nextSetData) {
        updateSet(next.exerciseIndex, next.setIndex, {
          ...nextSetData,
          weight: currentSetData.weight,
        });
      }
    }

    // Compute intra-session weight recommendation for next set (same exercise, non-warmup only)
    if (!currentSetData.isWarmup && next.exerciseIndex === state.exerciseIndex) {
      const reps = parseInt(currentSetData.reps);
      const rir = currentSetData.rir !== "" ? parseInt(currentSetData.rir) : null;
      const weight = parseFloat(currentSetData.weight);
      const [minReps, maxReps] = currentExercise.repRange;
      const delta = kgToDisplay(currentExercise.increment, unit);

      if (!isNaN(reps) && !isNaN(weight)) {
        const goUp = reps > maxReps || (reps >= minReps && rir !== null && rir >= 3);
        const goDown = reps < minReps;

        if (goUp) {
          const suggested = (Math.round((weight + delta) * 100) / 100).toString();
          setSetRec({ direction: "up", suggestedWeight: suggested });
        } else if (goDown) {
          const suggested = (Math.max(0, Math.round((weight - delta) * 100) / 100)).toString();
          setSetRec({ direction: "down", suggestedWeight: suggested });
        } else {
          setSetRec(null);
        }
      } else {
        setSetRec(null);
      }
    } else {
      // Different exercise or warmup — clear recommendation
      setSetRec(null);
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
      const endsAt = Date.now() + restSecs * 1000;
      restDurationRef.current = restSecs;
      setRestEndsAt(endsAt);
      startRestTimer(restSecs, next.info);
      onRestStart?.(endsAt, restSecs);
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
    setSetRec(null);

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

  const handleGoBack = useCallback(() => {
    cancelRestTimer();
    setRestEndsAt(null);
    setSetRec(null);

    let prevExIdx = state.exerciseIndex;
    let prevSetIdx = state.setIndex - 1;

    if (prevSetIdx < 0) {
      prevExIdx = state.exerciseIndex - 1;
      if (prevExIdx < 0) return; // already at the very first set
      prevSetIdx = (exercises[prevExIdx]?.sets.length ?? 1) - 1;
    }

    dispatch({ type: "NEXT_SET", nextExIdx: prevExIdx, nextSetIdx: prevSetIdx });
    triggerSetFlash();
    if (prevExIdx !== state.exerciseIndex) triggerExerciseFlash();
  }, [state.exerciseIndex, state.setIndex, exercises, cancelRestTimer]);

  const handleGoForward = useCallback(() => {
    cancelRestTimer();
    setRestEndsAt(null);
    setSetRec(null);

    const next = getNextInfo();
    if (!next) return;

    dispatch({ type: "NEXT_SET", nextExIdx: next.exerciseIndex, nextSetIdx: next.setIndex });
    triggerSetFlash();
    if (next.exerciseIndex !== state.exerciseIndex) triggerExerciseFlash();
  }, [state.exerciseIndex, getNextInfo, cancelRestTimer]);

  const handleGoHome = useCallback(() => {
    cancelRestTimer();
    router.push("/");
  }, [cancelRestTimer, router]);

  const canGoForward = (() => {
    const nextSetIdx = state.setIndex + 1;
    const exSets = exercises[state.exerciseIndex]?.sets;
    if (exSets && nextSetIdx < exSets.length) return true;
    return state.exerciseIndex + 1 < day.exercises.length;
  })();

  const isLastSet = state.setIndex >= (currentExState?.sets.length ?? 1) - 1;

  function handleDisableWarmups() {
    localStorage.setItem("gym-disable-warmups", "true");
  }

  // Safety: if state is inconsistent, finish the session
  if (!currentExercise || !currentExState || !currentSetData) {
    onFinish();
    return null;
  }

  // Warmup-adjusted set counter values for display
  const hasWarmup = currentExState.sets[0]?.isWarmup ?? false;
  const warmupOffset = hasWarmup ? 1 : 0;
  const displaySetNumber = currentSetData.isWarmup ? 0 : state.setIndex - warmupOffset + 1;
  const displayTotalSets = currentExState.sets.length - warmupOffset;

  return (
    <GuidedExerciseCard
      key={state.exerciseIndex}
      exercise={currentExercise}
      exerciseName={currentDisplayName}
      exerciseIndex={state.exerciseIndex}
      totalExercises={day.exercises.length}
      setIndex={displaySetNumber}
      totalSets={displayTotalSets}
      setData={currentSetData}
      overload={overloads[activeExerciseId]}
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
      onGoBack={handleGoBack}
      canGoBack={state.exerciseIndex > 0 || state.setIndex > 0}
      onGoForward={handleGoForward}
      canGoForward={canGoForward}
      alternatives={currentAlternatives}
      onSwitchAlternative={onSwitchAlternative ? (alt) => onSwitchAlternative(state.exerciseIndex, alt) : undefined}
      setRec={setRec}
      onApplyRec={() => {
        if (!setRec) return;
        const cur = exercises[state.exerciseIndex]?.sets[state.setIndex];
        if (cur) updateSet(state.exerciseIndex, state.setIndex, { ...cur, weight: setRec.suggestedWeight });
        setSetRec(null);
      }}
      isLastSet={isLastSet}
      onAddSet={onAddSet ? () => onAddSet(state.exerciseIndex) : undefined}
      onStop={onStop}
      onNameChange={(name) =>
        setExerciseNameOverrides((prev) => ({ ...prev, [currentExercise.id]: name }))
      }
      onGoHome={handleGoHome}
    />
  );
}
