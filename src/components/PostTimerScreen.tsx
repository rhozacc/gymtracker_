"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Exercise } from "@/lib/program";

interface PostTimerScreenProps {
  exercise: Exercise;
  setIndex: number;
  totalSets: number;
  currentWeight: string;
  unit: string;
  increments: number[];
  onEnterSet: (reps: number, rir?: number) => void;
  onChangeWeight: (weight: string) => void;
  onSkip: () => void;
  onStop: () => void;
}

export function PostTimerScreen({
  exercise,
  setIndex,
  totalSets,
  currentWeight,
  unit,
  increments,
  onEnterSet,
  onChangeWeight,
  onSkip,
  onStop,
}: PostTimerScreenProps) {
  const [view, setView] = useState<"main" | "reps" | "rir" | "weight">("main");
  const [tempWeight, setTempWeight] = useState(currentWeight);
  const [selectedReps, setSelectedReps] = useState<number | null>(null);

  function adjustWeight(delta: number) {
    const current = parseFloat(tempWeight) || 0;
    const newVal = Math.max(0, current + delta);
    setTempWeight((Math.round(newVal * 100) / 100).toString());
  }

  const content = (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg/95 px-4">
      {view === "main" && (
        <>
          <p className="text-muted text-xs uppercase tracking-wide">Up Next</p>
          <h2 className="text-2xl font-medium mt-2">{exercise.name}</h2>
          <p className="text-accent text-lg mt-1">
            {currentWeight} {unit}
          </p>
          <p className="text-muted text-sm mt-1">
            Set {setIndex + 1} of {totalSets} &middot; {exercise.repRange[0]}–{exercise.repRange[1]} reps
          </p>

          <div className="w-full max-w-xs mt-8 space-y-3">
            <button
              onClick={() => setView("reps")}
              className="w-full h-14 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity"
            >
              Enter Reps
            </button>
            <button
              onClick={() => setView("weight")}
              className="w-full h-12 border border-border text-accent rounded text-sm hover:border-muted transition-colors"
            >
              Change Weight
            </button>
            <button
              onClick={onSkip}
              className="w-full h-12 border border-border text-muted rounded text-sm hover:border-muted hover:text-accent transition-colors"
            >
              Skip Exercise
            </button>
            <button
              onClick={onStop}
              className="w-full h-12 border border-red-900/50 text-red-400 rounded text-sm hover:border-red-700 transition-colors"
            >
              Stop Guided Mode
            </button>
          </div>
        </>
      )}

      {view === "reps" && (
        <>
          <p className="text-muted text-xs uppercase tracking-wide">How many reps?</p>
          <h2 className="text-lg font-medium mt-2">
            {exercise.name} — Set {setIndex + 1}
          </h2>

          <div className="grid grid-cols-5 gap-2 mt-6 w-full max-w-xs">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => { setSelectedReps(n); setView("rir"); }}
                className={`h-14 rounded font-medium text-lg transition-colors ${
                  n >= exercise.repRange[0] && n <= exercise.repRange[1]
                    ? "bg-accent text-bg"
                    : "bg-surface border border-border text-accent"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const custom = prompt("Enter reps:");
              if (custom) {
                const n = parseInt(custom);
                if (!isNaN(n) && n > 0) { setSelectedReps(n); setView("rir"); }
              }
            }}
            className="mt-3 w-full max-w-xs h-12 border border-border text-muted rounded text-sm hover:text-accent transition-colors"
          >
            Custom
          </button>

          <button
            onClick={() => setView("main")}
            className="mt-4 text-muted text-sm hover:text-accent"
          >
            &larr; Back
          </button>
        </>
      )}

      {view === "rir" && selectedReps !== null && (
        <>
          <p className="text-muted text-xs uppercase tracking-wide">Reps in Reserve?</p>
          <h2 className="text-lg font-medium mt-2">
            {exercise.name} — Set {setIndex + 1}
          </h2>
          <p className="text-muted text-xs mt-1">
            {selectedReps} reps @ {currentWeight} {unit}
          </p>

          <div className="grid grid-cols-3 gap-3 mt-6 w-full max-w-xs">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => onEnterSet(selectedReps, n)}
                className={`h-16 rounded font-medium text-lg transition-colors ${
                  n <= 1
                    ? "bg-accent text-bg"
                    : "bg-surface border border-border text-accent"
                }`}
              >
                <span className="block">{n}</span>
                <span className="block text-[10px] font-normal opacity-60">
                  {n === 0 ? "failure" : n === 1 ? "almost" : `${n} left`}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => onEnterSet(selectedReps)}
            className="mt-4 w-full max-w-xs h-12 border border-border text-muted rounded text-sm hover:text-accent transition-colors"
          >
            Skip RIR
          </button>

          <button
            onClick={() => setView("reps")}
            className="mt-3 text-muted text-sm hover:text-accent"
          >
            &larr; Back
          </button>
        </>
      )}

      {view === "weight" && (
        <>
          <p className="text-muted text-xs uppercase tracking-wide">Adjust Weight</p>
          <h2 className="text-lg font-medium mt-2">
            {exercise.name} — Set {setIndex + 1}
          </h2>

          <div className="text-4xl font-bold mt-6 tabular-nums">
            {tempWeight} <span className="text-muted text-lg">{unit}</span>
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
              onChangeWeight(tempWeight);
              setView("main");
            }}
            className="mt-6 w-full max-w-xs h-12 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity"
          >
            Confirm
          </button>

          <button
            onClick={() => {
              setTempWeight(currentWeight);
              setView("main");
            }}
            className="mt-3 text-muted text-sm hover:text-accent"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
