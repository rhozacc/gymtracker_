"use client";

import { useMemo, useState, useCallback } from "react";
import { type WeightUnit, kgToDisplay } from "@/lib/units";
import type { Exercise } from "@/lib/program";
import type { OverloadResult } from "@/lib/overload";
import type { SetInput } from "@/components/SetRow";
import { OverloadBanner } from "@/components/OverloadBanner";

const WARMUP_HINTS = [
  "just do a few easy reps",
  "go light — get the blood flowing",
  "no weight data yet — feel it out today",
  "pick something comfortable and warm up",
  "start easy, ramp up from here",
  "next session I'll have numbers for you",
  "warm up however feels right",
  "no rush — loosen up at your own pace",
];

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
  restRemaining: number;
  restDuration: number;
  leftHanded: boolean;
  setFlash: boolean;
  exerciseFlash: boolean;
  confirmSkip: boolean;
  onWeightTap: () => void;
  onEditName: () => void;
  onChange: (data: SetInput) => void;
  onDone: () => void;
  onSkipRest: () => void;
  onSkipConfirm: () => void;
  onSkipCancel: () => void;
  onSkipRequest: () => void;
  onSkipWarmup: () => void;
  onDisableWarmups: () => void;
  skipWarmupCount: number;
  onStop: () => void;
}

function formatRestTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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
  restRemaining,
  restDuration,
  leftHanded,
  setFlash,
  exerciseFlash,
  confirmSkip,
  onWeightTap,
  onEditName,
  onChange,
  onDone,
  onSkipRest,
  onSkipConfirm,
  onSkipCancel,
  onSkipRequest,
  onSkipWarmup,
  onDisableWarmups,
  skipWarmupCount,
  onStop,
}: MainViewProps) {
  const [showRirInfo, setShowRirInfo] = useState(false);
  const [ripple, setRipple] = useState(false);

  const handleDone = useCallback(() => {
    if (!setData.isWarmup && (!setData.weight || !setData.reps)) return;
    navigator.vibrate?.(100);
    setRipple(true);
    setTimeout(() => setRipple(false), 420);
    onDone();
  }, [setData, onDone]);
  const selectedReps = parseInt(setData.reps) || null;
  const selectedRir = setData.rir !== "" ? parseInt(setData.rir) : null;

  // Stable random hint for "no warmup data" case
  const warmupHint = useMemo(
    () => WARMUP_HINTS[Math.floor(Math.random() * WARMUP_HINTS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setData.isWarmup, setIndex, exerciseIndex]
  );

  const repStart = Math.max(1, exercise.repRange[0] - 10);
  const repEnd = exercise.repRange[1];
  const repButtons = Array.from({ length: repEnd - repStart + 1 }, (_, i) => repStart + i);

  const isResting = restRemaining > 0;
  const restFillPct = restDuration > 0 ? ((restDuration - restRemaining) / restDuration) * 100 : 0;

  const endSessionBtn = (
    <button
      onClick={onStop}
      className="flex-1 px-3 py-2.5 border border-red-400 text-red-400 text-sm rounded hover:bg-red-400/10 transition-colors"
    >
      End Session
    </button>
  );

  const skipBtn = confirmSkip ? null : (
    <button
      onClick={onSkipRequest}
      className="flex-1 px-3 py-2.5 border border-border text-muted text-sm rounded hover:border-accent hover:text-accent transition-colors"
    >
      Skip
    </button>
  );

  return (
    <div className="flex flex-col items-center py-6 px-4">
      <p className="text-muted text-xs uppercase tracking-wide">
        Exercise {exerciseIndex + 1}/{totalExercises}
      </p>

      <div className="flex items-center gap-2 mt-1">
        <h2 className={`text-2xl font-medium transition-colors duration-500 ${exerciseFlash ? "text-accent" : ""}`}>{exerciseName}</h2>
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

      <p className={`text-lg font-medium mt-1 transition-colors duration-500 ${setFlash ? "text-accent" : "text-muted"}`}>
        {setData.isWarmup ? "Warmup" : `Set ${setIndex}/${totalSets - 1}`}
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

      {setData.isWarmup && !setData.weight ? (
        <p className="mt-5 text-muted text-sm text-center max-w-xs italic">{warmupHint}</p>
      ) : (
        <button
          onClick={onWeightTap}
          className="mt-5 flex items-baseline gap-1.5 group"
        >
          {setData.isWarmup && (
            <span className="text-4xl font-bold tabular-nums text-accent/60 group-hover:opacity-80 transition-opacity">~</span>
          )}
          <span className="text-4xl font-bold tabular-nums text-accent group-hover:opacity-80 transition-opacity">
            {setData.isWarmup ? setData.weight : (setData.weight || "0")}
          </span>
          <span className="text-muted text-sm">{unit}</span>
          <span className="text-muted text-xs ml-1 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
        </button>
      )}

      {!setData.isWarmup && (
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
      )}

      {!setData.isWarmup && (
        <div className="mt-4 w-full max-w-xs">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <p className="text-muted text-[10px] uppercase tracking-wide">RIR</p>
            <button
              onClick={() => setShowRirInfo((v) => !v)}
              aria-label="What is RIR?"
              className="w-4 h-4 rounded-full border border-muted/50 flex items-center justify-center text-muted hover:border-accent hover:text-accent transition-colors"
            >
              <span className="text-[9px] font-medium leading-none">i</span>
            </button>
          </div>
          {showRirInfo && (
            <div className="mb-3 px-3 py-2 bg-surface border border-border rounded text-xs text-muted leading-relaxed text-left">
              <span className="text-accent font-medium">Reps in Reserve</span> — how many more reps you could do before failure. RIR 0 means you hit failure. RIR 2 means you had 2 left. Tracking it keeps effort honest over time.
            </div>
          )}
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
      )}

      {/* Done button / rest countdown */}
      {isResting ? (
        <button
          onClick={onSkipRest}
          className="relative mt-6 w-full max-w-xs h-14 overflow-hidden border border-accent rounded text-sm"
        >
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-[250ms] ease-linear"
            style={{
              width: `${restFillPct}%`,
              backgroundColor: "var(--color-accent)",
            }}
          />
          <span className="relative z-10 text-bg text-sm tabular-nums font-medium">
            {formatRestTime(restRemaining)} — tap to skip
          </span>
        </button>
      ) : (
        <button
          onClick={handleDone}
          disabled={!setData.isWarmup && (!setData.weight || !setData.reps)}
          className="relative mt-6 w-full max-w-xs h-14 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-30"
        >
          {ripple && (
            <span
              className="absolute inset-0 rounded bg-white/25 pointer-events-none"
              style={{ animation: "done-ripple 420ms ease-out forwards" }}
            />
          )}
          Done
        </button>
      )}

      {/* Skip / End Session row */}
      {confirmSkip ? (
        <div className="mt-4 w-full max-w-xs space-y-2">
          <div className="flex gap-2">
            <button
              onClick={onSkipConfirm}
              className="flex-1 px-3 py-2.5 border border-border text-muted text-sm rounded hover:border-accent hover:text-accent transition-colors"
            >
              Skip Exercise
            </button>
            <button
              onClick={setData.isWarmup ? onSkipWarmup : onSkipCancel}
              className="flex-1 px-3 py-2.5 text-muted text-sm hover:text-accent transition-colors"
            >
              {setData.isWarmup ? "Skip Warmup" : "Cancel"}
            </button>
          </div>
          {setData.isWarmup && skipWarmupCount >= 3 && (
            <div className="text-center pt-1">
              <button
                onClick={onDisableWarmups}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Disable Warmups Forever
              </button>
              <p className="text-[10px] text-muted mt-0.5">You can always turn Warmups back on in Settings</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 flex gap-2 w-full max-w-xs">
          {leftHanded ? (
            <>
              {!isResting && skipBtn}
              {endSessionBtn}
            </>
          ) : (
            <>
              {endSessionBtn}
              {!isResting && skipBtn}
            </>
          )}
        </div>
      )}
    </div>
  );
}
