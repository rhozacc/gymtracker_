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
  fromRest?: boolean;
  onChange: (data: SetInput) => void;
  onDone: () => void;
  onSkip: () => void;
  onStop: () => void;
  onNameChange: (name: string) => void;
  onRestAnimationDone?: () => void;
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
  fromRest,
  onChange,
  onDone,
  onSkip,
  onStop,
  onNameChange,
  onRestAnimationDone,
}: GuidedExerciseCardProps) {
  const [view, setView] = useState<"main" | "weight" | "editName">("main");
  const [tempWeight, setTempWeight] = useState(setData.weight);
  const [tempName, setTempName] = useState(exerciseName);
  const [greenFlash, setGreenFlash] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

  useEffect(() => {
    setTempName(exerciseName);
  }, [exerciseName]);

  useEffect(() => {
    if (fromRest) {
      setGreenFlash(true);
      const t = setTimeout(() => {
        setGreenFlash(false);
        onRestAnimationDone?.();
      }, 900);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromRest]);

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
      greenFlash={greenFlash}
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
      onSkipConfirm={() => { setConfirmSkip(false); onSkip(); }}
      onSkipCancel={() => setConfirmSkip(false)}
      onSkipRequest={() => setConfirmSkip(true)}
      onStop={onStop}
    />
  );
}
