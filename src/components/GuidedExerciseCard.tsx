"use client";

import { useState, useEffect } from "react";
import { Exercise } from "@/lib/program";
import { OverloadResult } from "@/lib/overload";
import { type WeightUnit, kgToDisplay } from "@/lib/units";
import { SetInput } from "@/components/SetRow";
import { OverloadBanner } from "@/components/OverloadBanner";

interface GuidedExerciseCardProps {
  exercise: Exercise;
  exerciseName: string; // may be overridden by parent
  exerciseIndex: number;
  totalExercises: number;
  setIndex: number;
  totalSets: number;
  setData: SetInput;
  overload?: OverloadResult;
  unit: WeightUnit;
  increments: number[];
  fromRest?: boolean; // true when arriving from rest timer → green flash
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

  // Sync tempName if exerciseName changes externally
  useEffect(() => {
    setTempName(exerciseName);
  }, [exerciseName]);

  // Green flash when arriving from rest
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

  const selectedReps = parseInt(setData.reps) || null;
  const selectedRir = setData.rir !== "" ? parseInt(setData.rir) : null;

  function adjustWeight(delta: number) {
    const current = parseFloat(tempWeight) || 0;
    const newVal = Math.max(0, current + delta);
    setTempWeight((Math.round(newVal * 100) / 100).toString());
  }

  // Dynamic rep range: start 10 below repRange[0] (min 1), end at repRange[1]
  const repStart = Math.max(1, exercise.repRange[0] - 10);
  const repEnd = exercise.repRange[1];
  const repButtons = Array.from({ length: repEnd - repStart + 1 }, (_, i) => repStart + i);

  // ── Weight editing view ──────────────────────────────────────────────────
  if (view === "weight") {
    return (
      <div className="flex flex-col items-center py-8 px-4">
        <p className="text-muted text-xs uppercase tracking-wide">Adjust Weight</p>
        <h2 className="text-lg font-medium mt-2">
          {exerciseName} — Set {setIndex + 1}
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

  // ── Exercise name editing view ───────────────────────────────────────────
  if (view === "editName") {
    return (
      <div className="flex flex-col items-center py-8 px-4">
        <p className="text-muted text-xs uppercase tracking-wide">Edit Exercise Name</p>

        <input
          type="text"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          autoFocus
          className="mt-6 text-xl font-medium text-center w-full max-w-xs bg-transparent text-text border-b-2 border-border focus:border-accent focus:outline-none py-1"
        />

        <button
          onClick={() => {
            if (tempName.trim()) onNameChange(tempName.trim());
            setView("main");
          }}
          className="mt-6 w-full max-w-xs h-12 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity"
        >
          Save
        </button>

        <button
          onClick={() => {
            setTempName(exerciseName);
            setView("main");
          }}
          className="mt-3 text-muted text-sm hover:text-accent"
        >
          Cancel
        </button>
      </div>
    );
  }

  // ── Main logging view ────────────────────────────────────────────────────
  return (
    <div
      className={`flex flex-col items-center py-6 px-4 transition-colors duration-700 ${
        greenFlash ? "bg-green-500/10" : ""
      }`}
    >
      {/* Header */}
      <p className="text-muted text-xs uppercase tracking-wide">Exercise {exerciseIndex + 1}/{totalExercises}</p>

      {/* Exercise name with edit icon */}
      <div className="flex items-center gap-2 mt-1">
        <h2 className="text-2xl font-medium">{exerciseName}</h2>
        <button
          onClick={() => {
            setTempName(exerciseName);
            setView("editName");
          }}
          className="text-muted hover:text-accent transition-colors p-1"
          aria-label="Edit exercise name"
        >
          {/* Pencil icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

      {/* Set info */}
      <p className="text-muted text-lg font-medium mt-1">
        Set {setIndex + 1}/{totalSets}
      </p>
      <p className="text-muted text-sm opacity-70">
        {exercise.repRange[0]}–{exercise.repRange[1]} reps
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

      {/* Dynamic reps grid */}
      <div className="mt-5 w-full max-w-xs">
        <p className="text-muted text-[10px] uppercase tracking-wide text-center mb-2">Reps</p>
        <div className="grid grid-cols-5 gap-1.5">
          {repButtons.map((n) => (
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
        onClick={() => {
          if (!setData.weight || !setData.reps) return;
          onDone();
        }}
        disabled={!setData.weight || !setData.reps}
        className="mt-6 w-full max-w-xs h-14 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-30"
      >
        Done
      </button>

      {/* Skip button */}
      {confirmSkip ? (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => { setConfirmSkip(false); onSkip(); }}
            className="px-4 py-1.5 border border-border text-muted text-sm rounded hover:border-accent hover:text-accent transition-colors"
          >
            Confirm skip
          </button>
          <button
            onClick={() => setConfirmSkip(false)}
            className="px-4 py-1.5 text-muted text-sm hover:text-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmSkip(true)}
          className="mt-4 px-4 py-1.5 border border-border text-muted text-sm rounded hover:border-accent hover:text-accent transition-colors"
        >
          Skip
        </button>
      )}

      <button
        onClick={onStop}
        className="mt-4 px-4 py-1.5 border border-red-400 text-red-400 text-sm rounded hover:bg-red-400/10 transition-colors"
      >
        End Session
      </button>
    </div>
  );
}
