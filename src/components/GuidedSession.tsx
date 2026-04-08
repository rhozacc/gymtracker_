"use client";

import { useReducer, useCallback } from "react";
import { DayDefinition } from "@/lib/program";
import { OverloadResult } from "@/lib/overload";
import { type WeightUnit } from "@/lib/units";
import { SetInput } from "@/components/SetRow";
import { RestTimer } from "@/components/RestTimer";
import { GuidedExerciseCard } from "@/components/GuidedExerciseCard";
import { PostTimerScreen } from "@/components/PostTimerScreen";
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

type Phase = "logging" | "resting" | "transitioning" | "complete";

interface GuidedState {
  phase: Phase;
  exerciseIndex: number;
  setIndex: number;
}

type GuidedAction =
  | { type: "COMPLETE_SET" }
  | { type: "TIMER_END" }
  | { type: "DISMISS_TIMER" }
  | { type: "ENTER_REPS"; nextExIdx: number; nextSetIdx: number }
  | { type: "SKIP_EXERCISE"; nextExIdx: number }
  | { type: "FINISH" };

function guidedReducer(state: GuidedState, action: GuidedAction): GuidedState {
  switch (action.type) {
    case "COMPLETE_SET":
      return { ...state, phase: "resting" };
    case "TIMER_END":
      return state; // beep + notification handled externally; flash still playing
    case "DISMISS_TIMER":
      return { ...state, phase: "transitioning" };
    case "ENTER_REPS":
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

  // Compute next exercise/set info for the rest timer preview
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

  // What exercise/set comes after the current rest
  const next = getNextInfo();

  const handleTimerEnd = useCallback(() => {
    playBeep();
    const nextName = next?.exercise.name || "Next set";
    notifyIfBackgrounded("Rest Complete", `Time to lift! ${nextName}`);
  }, [playBeep, notifyIfBackgrounded, next]);

  const handleDismissTimer = useCallback(() => {
    // If there's no next exercise, we're done
    if (!next) {
      onFinish();
      return;
    }
    dispatch({ type: "DISMISS_TIMER" });
  }, [next, onFinish]);

  const handleSetDone = useCallback(() => {
    if (!currentSetData || (!currentSetData.weight && !currentSetData.reps)) return;
    // Mark set as done in parent state
    updateSet(state.exerciseIndex, state.setIndex, { ...currentSetData, done: true });
    dispatch({ type: "COMPLETE_SET" });
  }, [currentSetData, state.exerciseIndex, state.setIndex, updateSet]);

  const handleEnterSet = useCallback(
    (reps: number, rir?: number) => {
      if (!next) {
        onFinish();
        return;
      }
      // Update the upcoming set's reps and RIR in parent state
      const nextSetData = exercises[next.exerciseIndex]?.sets[next.setIndex];
      if (nextSetData) {
        updateSet(next.exerciseIndex, next.setIndex, {
          ...nextSetData,
          reps: reps.toString(),
          rir: rir !== undefined ? rir.toString() : nextSetData.rir,
        });
      }
      dispatch({ type: "ENTER_REPS", nextExIdx: next.exerciseIndex, nextSetIdx: next.setIndex });
    },
    [next, exercises, updateSet, onFinish]
  );

  const handleChangeWeight = useCallback(
    (weight: string) => {
      if (!next) return;
      const nextSetData = exercises[next.exerciseIndex]?.sets[next.setIndex];
      if (nextSetData) {
        updateSet(next.exerciseIndex, next.setIndex, { ...nextSetData, weight });
      }
    },
    [next, exercises, updateSet]
  );

  const handleSkipExercise = useCallback(() => {
    if (!next) {
      onFinish();
      return;
    }
    // Skip to the next exercise entirely (not next set of same exercise)
    let skipToExIdx = state.exerciseIndex + 1;
    // If we're already showing a different exercise in the post-timer, skip to the one after that
    if (next.exerciseIndex > state.exerciseIndex) {
      skipToExIdx = next.exerciseIndex + 1;
    }
    if (skipToExIdx >= day.exercises.length) {
      onFinish();
      return;
    }
    dispatch({ type: "SKIP_EXERCISE", nextExIdx: skipToExIdx });
  }, [next, state.exerciseIndex, day.exercises.length, onFinish]);

  if (!currentExercise || !currentExState || !currentSetData) {
    // Safety: if indices are out of bounds, finish
    onFinish();
    return null;
  }

  // LOGGING phase: show the current exercise card
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
      />
    );
  }

  // RESTING phase: show the rest timer with next exercise info
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

  // TRANSITIONING phase: show the post-timer screen for the next exercise
  if (state.phase === "transitioning" && next) {
    const nextSetData = exercises[next.exerciseIndex]?.sets[next.setIndex];
    return (
      <PostTimerScreen
        exercise={next.exercise}
        setIndex={next.setIndex}
        totalSets={exercises[next.exerciseIndex]?.sets.length || next.exercise.sets}
        currentWeight={nextSetData?.weight || ""}
        unit={unit}
        increments={increments}
        onEnterSet={handleEnterSet}
        onChangeWeight={handleChangeWeight}
        onSkip={handleSkipExercise}
        onStop={onStop}
      />
    );
  }

  return null;
}
