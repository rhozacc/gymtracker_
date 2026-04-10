"use client";

import { type WeightUnit, kgToDisplay } from "@/lib/units";
import type { Exercise } from "@/lib/program";
import type { OverloadResult } from "@/lib/overload";
import type { SetInput } from "@/components/SetRow";
import { OverloadBanner } from "@/components/OverloadBanner";
import { useTheme } from "@/lib/useTheme";

// ── Shared types ─────────────────────────────────────────────────────────────

export interface ViewProps {
  exerciseName: string;
  setData: SetInput;
  unit: WeightUnit;
  increments: number[];
  onBack: () => void;
}

// ── Weight adjustment view ───────────────────────────────────────────────────

interface WeightAdjustViewProps extends ViewProps {
  setIndex: number;
  tempWeight: string;
  onTempWeightChange: (v: string) => void;
  onAdjust: (delta: number) => void;
  onConfirm: () => void;
}

export function WeightAdjustView({
  exerciseName,
  setIndex,
  unit,
  increments,
  tempWeight,
  onTempWeightChange,
  onAdjust,
  onConfirm,
  onBack,
}: WeightAdjustViewProps) {
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
          onChange={(e) => onTempWeightChange((e.target as HTMLInputElement).value)}
          className="text-4xl font-bold tabular-nums text-center w-36 bg-transparent border-b-2 border-border focus:border-accent focus:outline-none"
        />
        <span className="text-muted text-lg">{unit}</span>
      </div>

      <div className="flex gap-2 mt-4 flex-wrap justify-center max-w-xs">
        {increments.map((inc) => (
          <button
            key={`m-${inc}`}
            onClick={() => onAdjust(-inc)}
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
            onClick={() => onAdjust(inc)}
            className="h-10 min-w-[48px] px-2 bg-surface border border-border rounded text-sm text-accent active:bg-border transition-colors"
          >
            +{inc}
          </button>
        ))}
      </div>

      <button
        onClick={onConfirm}
        className="mt-3 w-full max-w-xs h-12 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity"
      >
        Confirm
      </button>

      <button
        onClick={onBack}
        className="mt-3 text-muted text-sm hover:text-accent"
      >
        Cancel
      </button>
    </div>
  );
}

// ── Exercise name editing view ───────────────────────────────────────────────

interface RenameViewProps {
  tempName: string;
  onTempNameChange: (v: string) => void;
  onSave: () => void;
  onBack: () => void;
}

export function RenameView({ tempName, onTempNameChange, onSave, onBack }: RenameViewProps) {
  return (
    <div className="flex flex-col items-center py-8 px-4">
      <p className="text-muted text-xs uppercase tracking-wide">Edit Exercise Name</p>

      <input
        type="text"
        value={tempName}
        onChange={(e) => onTempNameChange((e.target as HTMLInputElement).value)}
        autoFocus
        className="mt-6 text-xl font-medium text-center w-full max-w-xs bg-transparent text-text border-b-2 border-border focus:border-accent focus:outline-none py-1"
      />

      <button
        onClick={onSave}
        className="mt-6 w-full max-w-xs h-12 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity"
      >
        Save
      </button>

      <button
        onClick={onBack}
        className="mt-3 text-muted text-sm hover:text-accent"
      >
        Cancel
      </button>
    </div>
  );
}

// ── Main logging view ────────────────────────────────────────────────────────

interface MainViewProps {
  exercise: Exercise;
  exerciseName: string;
  exerciseIndex: number;
  totalExercises: number;
  setIndex: number;
  totalSets: number;
  setData: SetInput;
  overload?: OverloadResult;
  unit: WeightUnit;
  greenFlash: boolean;
  confirmSkip: boolean;
  onWeightTap: () => void;
  onEditName: () => void;
  onChange: (data: SetInput) => void;
  onDone: () => void;
  onSkipConfirm: () => void;
  onSkipCancel: () => void;
  onSkipRequest: () => void;
  onStop: () => void;
}

export function MainView({
  exercise,
  exerciseName,
  exerciseIndex,
  totalExercises,
  setIndex,
  totalSets,
  setData,
  overload,
  unit,
  greenFlash,
  confirmSkip,
  onWeightTap,
  onEditName,
  onChange,
  onDone,
  onSkipConfirm,
  onSkipCancel,
  onSkipRequest,
  onStop,
}: MainViewProps) {
  const { theme, toggleTheme } = useTheme();
  const selectedReps = parseInt(setData.reps) || null;
  const selectedRir = setData.rir !== "" ? parseInt(setData.rir) : null;

  const repStart = Math.max(1, exercise.repRange[0] - 10);
  const repEnd = exercise.repRange[1];
  const repButtons = Array.from({ length: repEnd - repStart + 1 }, (_, i) => repStart + i);

  return (
    <div
      className={`relative flex flex-col items-center py-6 px-4 transition-colors duration-700 ${
        greenFlash ? "bg-green-500/10" : ""
      }`}
    >
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:border-accent hover:text-accent transition-colors"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
      <p className="text-muted text-xs uppercase tracking-wide">
        Exercise {exerciseIndex + 1}/{totalExercises}
      </p>

      <div className="flex items-center gap-2 mt-1">
        <h2 className="text-2xl font-medium">{exerciseName}</h2>
        <button
          onClick={onEditName}
          className="text-muted hover:text-accent transition-colors p-1"
          aria-label="Edit exercise name"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

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
          <OverloadBanner
            suggestedWeight={kgToDisplay(overload.suggestedWeight, unit)}
            unit={unit}
            variant={overload.status}
          />
        </div>
      )}

      <button
        onClick={onWeightTap}
        className="mt-5 flex items-baseline gap-1.5 group"
      >
        <span className="text-4xl font-bold tabular-nums text-accent group-hover:opacity-80 transition-opacity">
          {setData.weight || "0"}
        </span>
        <span className="text-muted text-sm">{unit}</span>
        <span className="text-muted text-xs ml-1 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
      </button>

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

      {confirmSkip ? (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onSkipConfirm}
            className="px-4 py-1.5 border border-border text-muted text-sm rounded hover:border-accent hover:text-accent transition-colors"
          >
            Confirm skip
          </button>
          <button
            onClick={onSkipCancel}
            className="px-4 py-1.5 text-muted text-sm hover:text-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={onSkipRequest}
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
