"use client";

import { useState } from "react";
import { Exercise } from "@/lib/program";
import { OverloadResult } from "@/lib/overload";
import { type WeightUnit, kgToDisplay } from "@/lib/units";
import { SetInput } from "@/components/SetRow";
import { OverloadBanner } from "@/components/OverloadBanner";

interface GuidedExerciseCardProps {
  exercise: Exercise;
  setIndex: number;
  totalSets: number;
  setData: SetInput;
  overload?: OverloadResult;
  unit: WeightUnit;
  increments: number[];
  onChange: (data: SetInput) => void;
  onDone: () => void;
  onSkip: () => void;
  onStop: () => void;
}

export function GuidedExerciseCard({
  exercise,
  setIndex,
  totalSets,
  setData,
  overload,
  unit,
  increments,
  onChange,
  onDone,
  onSkip,
  onStop,
}: GuidedExerciseCardProps) {
  const [view, setView] = useState<"main" | "weight">("main");
  const [tempWeight, setTempWeight] = useState(setData.weight);

  const selectedReps = parseInt(setData.reps) || null;
  const selectedRir = setData.rir !== "" ? parseInt(setData.rir) : null;

  function adjustWeight(delta: number) {
    const current = parseFloat(tempWeight) || 0;
    const newVal = Math.max(0, current + delta);
    setTempWeight((Math.round(newVal * 100) / 100).toString());
  }

  function handleDone() {
    if (!setData.weight || !setData.reps) return;
    onDone();
  }

  if (view === "weight") {
    return (
      <div className="flex flex-col items-center py-8 px-4">
        <p className="text-muted text-xs uppercase tracking-wide">Adjust Weight</p>
        <h2 className="text-lg font-medium mt-2">
          {exercise.name} — Set {setIndex + 1}
        </h2>

        <div className="flex items-baseline gap-2 mt-6">
          <input
            type="text"
            inputMode="decimal"
            value={tempWeight}
            onChange={(e) => setTempWeight(e.target.value)}
            className="text-4xl font-bold tabular-nums text-center w-36 bg-transparent border-b-2 border-border focus:border-accent focus:outline-none"
          />
          <span className="text-muted text-lg">{unit}</span>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap justify-center max-w-xs">
          {increments.map((inc) => (
            <button
              key={`m-${inc}`}
              onClick={() => adjustWeight(-inc)}
              className="h-10 min-w-[48px] px-2 bg-surface border border-border rounded text-sm text-muted active:bg-border transition-colors"
            >
              −{inc}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2 flex-wrap justify-center max-w-xs">
          {increments.map((inc) => (
            <button
              key={`p-${inc}`}
              onClick={() => adjustWeight(inc)}
              className="h-10 min-w-[48px] px-2 bg-surface border border-border rounded text-sm text-accent active:bg-border transition-colors"
            >
              +{inc}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            const n = parseFloat(tempWeight);
            const rounded = !isNaN(n) && n >= 0 ? (Math.round(n * 100) / 100).toString() : tempWeight;
            onChange({ ...setData, weight: rounded });
            setView("main");
          }}
          className="mt-3 w-full max-w-xs h-12 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity"
        >
          Confirm
        </button>

        <button
          onClick={() => {
            setTempWeight(setData.weight);
            setView("main");
          }}
          className="mt-3 text-muted text-sm hover:text-accent"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-6 px-4">
      {/* Header */}
      <p className="text-muted text-xs uppercase tracking-wide">Current Exercise</p>
      <h2 className="text-2xl font-medium mt-1">{exercise.name}</h2>
      <p className="text-muted text-sm mt-1">
        Set {setIndex + 1} of {totalSets} &middot; {exercise.repRange[0]}–{exercise.repRange[1]} reps
      </p>

      {overload && overload.lastWeight > 0 && (
        <p className="text-muted text-xs mt-2">
          Last: {kgToDisplay(overload.lastWeight, unit)} {unit} &times; [{overload.lastReps.join(", ")}]
        </p>
      )}

      {(overload?.status === "go_up" || overload?.status === "almost_ready") && (
        <div className="mt-2 w-full max-w-xs">
          <OverloadBanner suggestedWeight={kgToDisplay(overload.suggestedWeight, unit)} unit={unit} variant={overload.status} />
        </div>
      )}

      {/* Weight — tappable */}
      <button
        onClick={() => {
          setTempWeight(setData.weight);
          setView("weight");
        }}
        className="mt-5 flex items-baseline gap-1.5 group"
      >
        <span className="text-4xl font-bold tabular-nums text-accent group-hover:opacity-80 transition-opacity">
          {setData.weight || "0"}
        </span>
        <span className="text-muted text-sm">{unit}</span>
        <span className="text-muted text-xs ml-1 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
      </button>

      {/* Reps grid */}
      <div className="mt-5 w-full max-w-xs">
        <p className="text-muted text-[10px] uppercase tracking-wide text-center mb-2">Reps</p>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => onChange({ ...setData, reps: n.toString() })}
              className={`h-11 rounded font-medium text-base transition-colors ${
                selectedReps === n
                  ? "bg-accent text-bg ring-2 ring-accent/50"
                  : n >= exercise.repRange[0] && n <= exercise.repRange[1]
                    ? "bg-surface border border-accent/30 text-accent"
                    : "bg-surface border border-border text-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* RIR row */}
      <div className="mt-4 w-full max-w-xs">
        <p className="text-muted text-[10px] uppercase tracking-wide text-center mb-2">RIR</p>
        <div className="grid grid-cols-6 gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange({ ...setData, rir: n.toString() })}
              className={`h-11 rounded text-sm transition-colors ${
                selectedRir === n
                  ? "bg-accent text-bg ring-2 ring-accent/50"
                  : "bg-surface border border-border text-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Done button */}
      <button
        onClick={handleDone}
        disabled={!setData.weight || !setData.reps}
        className="mt-6 w-full max-w-xs h-14 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-30"
      >
        Done
      </button>

      {/* Secondary actions */}
      <div className="flex gap-6 mt-4">
        <button
          onClick={onSkip}
          className="text-muted text-sm hover:text-accent transition-colors"
        >
          Skip Exercise
        </button>
        <button
          onClick={onStop}
          className="text-red-400 text-sm hover:text-red-300 transition-colors"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
