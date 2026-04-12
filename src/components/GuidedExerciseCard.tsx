"use client";

import { useState, useEffect, useRef } from "react";
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
  onSkipWarmup: () => void;
  onDisableWarmups: () => void;
  skipWarmupCount: number;
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
  onSkipWarmup,
  onDisableWarmups,
  skipWarmupCount,
  onStop,
  onNameChange,
}: GuidedExerciseCardProps) {
  const [view, setView] = useState<"main" | "weight" | "editName">("main");
  const [tempWeight, setTempWeight] = useState(setData.weight);
  const [tempName, setTempName] = useState(exerciseName);
  const [leftHanded, setLeftHanded] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

  // Slide-up entrance: starts invisible, becomes visible after first paint
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    rafRef.current = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

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

  const entranceStyle: React.CSSProperties = {
    transition: "opacity 250ms ease-out, transform 250ms ease-out",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(14px)",
  };

  if (view === "weight") {
    return (
      <div style={entranceStyle}>
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
      </div>
    );
  }

  if (view === "editName") {
    return (
      <div style={entranceStyle}>
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
      </div>
    );
  }

  return (
    <div style={entranceStyle}>
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
        onSkipWarmup={() => { setConfirmSkip(false); onSkipWarmup(); }}
        onDisableWarmups={() => { setConfirmSkip(false); onDisableWarmups(); onSkipWarmup(); }}
        skipWarmupCount={skipWarmupCount}
        onStop={onStop}
      />
    </div>
  );
}
