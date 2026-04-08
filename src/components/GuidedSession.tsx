"use client";

import { useReducer, useCallback } from "react";
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
}

type Phase = "logging" | "resting" | "complete";

interface GuidedState {
  phase: Phase;
  exerciseIndex: number;
  setIndex: number;
}

type GuidedAction =
  | { type: "COMPLETE_SET" }
  | { type: "NEXT_SET"; nextExIdx: number; nextSetIdx: number }
  | { type: "SKIP_EXERCISE"; nextExIdx: number }
  | { type: "FINISH" };

function guidedReducer(state: GuidedState, action: GuidedAction): GuidedState {
  switch (action.type) {
    case "COMPLETE_SET":
      return { ...state, phase: "resting" };
    case "NEXT_SET":
      return { phase: "logging", exerciseIndex: action.nextExIdx, setIndex: action.nextSetIdx };
    case "SKIP_EXERCISE":
      return { phase: "logging", exerciseIndex: action.nextExIdx, setIndex: 0 };
    case "FINISH":
      return { ...state, phase: "complete" };
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
    phase: "logging",
    exerciseIndex: 0,
    setIndex: 0,
  });

  const { playBeep } = useBeep();
  const { notifyIfBackgrounded } = useBackgroundNotification();

  const currentExercise = day.exercises[state.exerciseIndex];
  const currentExState = exercises[state.exerciseIndex];
  const currentSetData = currentExState?.sets[state.setIndex];

  // Compute next exercise/set after the current one
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
    const nextSetData = exercises[nextExIdx]?.sets[nextSetIdx];
    return {
      exerciseIndex: nextExIdx,
      setIndex: nextSetIdx,
      exercise: nextEx,
      info: {
        name: nextEx.name,
        weight: nextSetData?.weight || "",
        reps: `${nextEx.repRange[0]}–${nextEx.repRange[1]}`,
        setNumber: nextSetIdx + 1,
        totalSets: exercises[nextExIdx]?.sets.length || nextEx.sets,
      },
    };
  }, [state.exerciseIndex, state.setIndex, day.exercises, exercises]);

  const next = getNextInfo();

  const handleTimerEnd = useCallback(() => {
    playBeep();
    const nextName = next?.exercise.name || "Next set";
    notifyIfBackgrounded("Rest Complete", `Time to lift! ${nextName}`);
  }, [playBeep, notifyIfBackgrounded, next]);

  const handleDismissTimer = useCallback(() => {
    if (!next) {
      onFinish();
      return;
    }
    dispatch({ type: "NEXT_SET", nextExIdx: next.exerciseIndex, nextSetIdx: next.setIndex });
  }, [next, onFinish]);

  const handleSetDone = useCallback(() => {
    if (!currentSetData || !currentSetData.weight || !currentSetData.reps) return;
    updateSet(state.exerciseIndex, state.setIndex, { ...currentSetData, done: true });
    dispatch({ type: "COMPLETE_SET" });
  }, [currentSetData, state.exerciseIndex, state.setIndex, updateSet]);

  const handleSkipExercise = useCallback(() => {
    let skipToExIdx = state.exerciseIndex + 1;
    if (skipToExIdx >= day.exercises.length) {
      onFinish();
      return;
    }
    dispatch({ type: "SKIP_EXERCISE", nextExIdx: skipToExIdx });
  }, [state.exerciseIndex, day.exercises.length, onFinish]);

  if (!currentExercise || !currentExState || !currentSetData) {
    onFinish();
    return null;
  }

  // LOGGING: show exercise screen with reps/RIR/weight
  if (state.phase === "logging") {
    return (
      <GuidedExerciseCard
        exercise={currentExercise}
        setIndex={state.setIndex}
        totalSets={currentExState.sets.length}
        setData={currentSetData}
        overload={overloads[currentExercise.id]}
        unit={unit}
        increments={increments}
        onChange={(data) => updateSet(state.exerciseIndex, state.setIndex, data)}
        onDone={handleSetDone}
        onSkip={handleSkipExercise}
        onStop={onStop}
      />
    );
  }

  // RESTING: countdown timer with next exercise preview
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

  return null;
}
