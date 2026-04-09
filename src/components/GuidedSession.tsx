"use client";

import { useReducer, useCallback, useState } from "react";
import { DayDefinition } from "@/lib/program";
import { OverloadResult } from "@/lib/overload";
import { type WeightUnit } from "@/lib/units";
import { SetInput } from "@/components/SetRow";
import { RestTimer } from "@/components/RestTimer";
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
  onListView: () => void;
}

type Phase = "logging" | "resting";

interface GuidedState {
  phase: Phase;
  exerciseIndex: number;
  setIndex: number;
}

type GuidedAction =
  | { type: "COMPLETE_SET" }
  | { type: "NEXT_SET"; nextExIdx: number; nextSetIdx: number }
  | { type: "SKIP_EXERCISE"; nextExIdx: number };

function guidedReducer(state: GuidedState, action: GuidedAction): GuidedState {
  switch (action.type) {
    case "COMPLETE_SET":
      return { ...state, phase: "resting" };
    case "NEXT_SET":
      return { phase: "logging", exerciseIndex: action.nextExIdx, setIndex: action.nextSetIdx };
    case "SKIP_EXERCISE":
      return { phase: "logging", exerciseIndex: action.nextExIdx, setIndex: 0 };
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
  onListView,
}: GuidedSessionProps) {
  const [state, dispatch] = useReducer(guidedReducer, {
    phase: "logging",
    exerciseIndex: 0,
    setIndex: 0,
  });

  // Green flash when arriving from rest timer
  const [fromRest, setFromRest] = useState(false);

  // Per-exercise name overrides (only for this session)
  const [exerciseNameOverrides, setExerciseNameOverrides] = useState<Record<string, string>>({});

  const { playBeep } = useBeep();
  const { notifyIfBackgrounded, startRestTimer, cancelRestTimer } = useBackgroundNotification();

  const currentExercise = day.exercises[state.exerciseIndex];
  const currentExState = exercises[state.exerciseIndex];
  const currentSetData = currentExState?.sets[state.setIndex];

  // Resolve the display name (override takes precedence)
  const currentDisplayName =
    exerciseNameOverrides[currentExercise?.id ?? ""] ?? currentExercise?.name ?? "";

  // Compute the next exercise/set after the current one
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
    return {
      exerciseIndex: nextExIdx,
      setIndex: nextSetIdx,
      exercise: nextEx,
      info: {
        name: nextExName,
        weight: nextSetData?.weight || "",
        reps: `${nextEx.repRange[0]}–${nextEx.repRange[1]}`,
        setNumber: nextSetIdx + 1,
        totalSets: exercises[nextExIdx]?.sets.length || nextEx.sets,
      },
    };
  }, [state.exerciseIndex, state.setIndex, day.exercises, exercises, exerciseNameOverrides]);

  const next = getNextInfo();

  const handleTimerEnd = useCallback(() => {
    playBeep();
    const nextName = next
      ? (exerciseNameOverrides[next.exercise.id] ?? next.exercise.name)
      : "Next set";
    notifyIfBackgrounded("Rest Complete", `Time to lift! ${nextName}`);
  }, [playBeep, notifyIfBackgrounded, next, exerciseNameOverrides]);

  const handleDismissTimer = useCallback(() => {
    // Cancel the SW lock-screen notification since we're returning to the app
    cancelRestTimer();

    if (!next) {
      onFinish();
      return;
    }

    // If moving to the next set of the SAME exercise, copy the current set's weight
    // so the user doesn't have to re-enter it
    if (next.exerciseIndex === state.exerciseIndex && currentSetData?.weight) {
      const nextSetData = exercises[next.exerciseIndex]?.sets[next.setIndex];
      if (nextSetData) {
        updateSet(next.exerciseIndex, next.setIndex, {
          ...nextSetData,
          weight: currentSetData.weight,
        });
      }
    }

    setFromRest(true);
    dispatch({ type: "NEXT_SET", nextExIdx: next.exerciseIndex, nextSetIdx: next.setIndex });
  }, [next, onFinish, state.exerciseIndex, currentSetData, exercises, updateSet, cancelRestTimer]);

  const handleSetDone = useCallback(() => {
    if (!currentSetData || !currentSetData.weight || !currentSetData.reps) return;
    updateSet(state.exerciseIndex, state.setIndex, { ...currentSetData, done: true });

    // Skip rest timer for the very last set of the very last exercise
    const isLastExercise = state.exerciseIndex >= day.exercises.length - 1;
    const isLastSet = state.setIndex >= (currentExState?.sets.length ?? 1) - 1;

    if (isLastExercise && isLastSet) {
      onFinish();
      return;
    }

    dispatch({ type: "COMPLETE_SET" });

    // Start the SW rest timer so a notification shows on the lock screen
    const restSecs = currentExercise.rest;
    const nextInfo = getNextInfo();
    startRestTimer(restSecs, nextInfo?.info);
  }, [currentSetData, state.exerciseIndex, state.setIndex, updateSet, day.exercises.length, currentExState, onFinish, currentExercise, getNextInfo, startRestTimer]);

  const handleSkipExercise = useCallback(() => {
    const skipToExIdx = state.exerciseIndex + 1;
    if (skipToExIdx >= day.exercises.length) {
      onFinish();
      return;
    }
    dispatch({ type: "SKIP_EXERCISE", nextExIdx: skipToExIdx });
  }, [state.exerciseIndex, day.exercises.length, onFinish]);

  // Safety: if state is inconsistent, finish the session
  if (!currentExercise || !currentExState || !currentSetData) {
    onFinish();
    return null;
  }

  // RESTING phase
  if (state.phase === "resting") {
    return (
      <RestTimer
        seconds={currentExercise.rest}
        onDismiss={handleDismissTimer}
        onTimerEnd={handleTimerEnd}
        nextExercise={next?.info}
      />
    );
  }

  // LOGGING phase
  return (
    <GuidedExerciseCard
      exercise={currentExercise}
      exerciseName={currentDisplayName}
      setIndex={state.setIndex}
      totalSets={currentExState.sets.length}
      setData={currentSetData}
      overload={overloads[currentExercise.id]}
      unit={unit}
      increments={increments}
      fromRest={fromRest}
      onChange={(data) => updateSet(state.exerciseIndex, state.setIndex, data)}
      onDone={handleSetDone}
      onSkip={handleSkipExercise}
      onStop={onStop}
      onListView={onListView}
      onNameChange={(name) =>
        setExerciseNameOverrides((prev) => ({ ...prev, [currentExercise.id]: name }))
      }
      onRestAnimationDone={() => setFromRest(false)}
    />
  );
}
