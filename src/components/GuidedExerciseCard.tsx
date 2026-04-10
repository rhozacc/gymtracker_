"use client";

import { useState, useEffect } from "react";
import type { Exercise } from "@/lib/program";
import type { OverloadResult } from "@/lib/overload";
import type { WeightUnit } from "@/lib/units";
import type { SetInput } from "@/components/SetRow";
import { WeightAdjustView, RenameView, MainView } from "./GuidedExerciseCardViews";

interface GuidedExerciseCardProps {
  exercise: Exercise;
  exerciseName: string;
  exerciseIndex: number;
  totalExercises: number;
  setIndex: number;
  totalSets: number;
  setData: SetInput;
  overload?: OverloadResult;
  unit: WeightUnit;
  increments: number[];
  restRemaining: number;
  restDuration: number;
  setFlash: boolean;
  exerciseFlash: boolean;
  onChange: (data: SetInput) => void;
  onDone: () => void;
  onSkipRest: () => void;
  onSkip: () => void;
  onStop: () => void;
  onNameChange: (name: string) => void;
}

export function GuidedExerciseCard({
  exercise,
  exerciseName,
  exerciseIndex,
  totalExercises,
  setIndex,
  totalSets,
  setData,
  overload,
  unit,
  increments,
  restRemaining,
  restDuration,
  setFlash,
  exerciseFlash,
  onChange,
  onDone,
  onSkipRest,
  onSkip,
  onStop,
  onNameChange,
}: GuidedExerciseCardProps) {
  const [view, setView] = useState<"main" | "weight" | "editName">("main");
  const [tempWeight, setTempWeight] = useState(setData.weight);
  const [tempName, setTempName] = useState(exerciseName);
  const [leftHanded, setLeftHanded] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

  useEffect(() => {
    setTempName(exerciseName);
  }, [exerciseName]);

  useEffect(() => {
    setLeftHanded(localStorage.getItem("gym-left-handed") === "1");
  }, []);

  // Reset confirmSkip when exercise changes
  useEffect(() => {
    setConfirmSkip(false);
  }, [exerciseIndex]);

  function adjustWeight(delta: number) {
    const current = parseFloat(tempWeight) || 0;
    const newVal = Math.max(0, current + delta);
    setTempWeight((Math.round(newVal * 100) / 100).toString());
  }

  if (view === "weight") {
    return (
      <WeightAdjustView
        exerciseName={exerciseName}
        setIndex={setIndex}
        unit={unit}
        increments={increments}
        setData={setData}
        tempWeight={tempWeight}
        onTempWeightChange={setTempWeight}
        onAdjust={adjustWeight}
        onConfirm={() => {
          const n = parseFloat(tempWeight);
          const rounded = !isNaN(n) && n >= 0
            ? (Math.round(n * 100) / 100).toString()
            : tempWeight;
          onChange({ ...setData, weight: rounded });
          setView("main");
        }}
        onBack={() => {
          setTempWeight(setData.weight);
          setView("main");
        }}
      />
    );
  }

  if (view === "editName") {
    return (
      <RenameView
        tempName={tempName}
        onTempNameChange={setTempName}
        onSave={() => {
          if (tempName.trim()) onNameChange(tempName.trim());
          setView("main");
        }}
        onBack={() => {
          setTempName(exerciseName);
          setView("main");
        }}
      />
    );
  }

  return (
    <MainView
      exercise={exercise}
      exerciseName={exerciseName}
      exerciseIndex={exerciseIndex}
      totalExercises={totalExercises}
      setIndex={setIndex}
      totalSets={totalSets}
      setData={setData}
      overload={overload}
      unit={unit}
      restRemaining={restRemaining}
      restDuration={restDuration}
      leftHanded={leftHanded}
      setFlash={setFlash}
      exerciseFlash={exerciseFlash}
      confirmSkip={confirmSkip}
      onWeightTap={() => {
        setTempWeight(setData.weight);
        setView("weight");
      }}
      onEditName={() => {
        setTempName(exerciseName);
        setView("editName");
      }}
      onChange={onChange}
      onDone={onDone}
      onSkipRest={onSkipRest}
      onSkipConfirm={() => { setConfirmSkip(false); onSkip(); }}
      onSkipCancel={() => setConfirmSkip(false)}
      onSkipRequest={() => setConfirmSkip(true)}
      onStop={onStop}
    />
  );
}
