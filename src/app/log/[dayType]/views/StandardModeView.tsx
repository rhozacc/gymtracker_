"use client";

import type { OverloadResult } from "@/lib/overload";
import { kgToDisplay, type WeightUnit } from "@/lib/units";
import { SetRow, type SetInput } from "@/components/SetRow";
import { OverloadBanner } from "@/components/OverloadBanner";
import type { DayDefinition } from "@/lib/program";
import type { ExerciseState } from "../types";

interface StandardModeViewProps {
  day: DayDefinition;
  exercises: ExerciseState[];
  overloads: Record<string, OverloadResult>;
  unit: WeightUnit;
  increments: number[];
  wasGuidedMode: boolean;
  guidedCompleted: boolean;
  saving: boolean;
  notes: string;
  onNotesChange: (v: string) => void;
  onContinueGuided: () => void;
  onFinish: () => void;
  onEndSession: () => void;
  onUpdateSet: (exIdx: number, setIdx: number, data: SetInput) => void;
  onAddSet: (exIdx: number) => void;
  onRemoveSet: (exIdx: number, setIdx: number) => void;
  onMarkDone: (exIdx: number) => void;
  onRenameExercise: (exerciseId: string, exerciseName: string) => void;
}

export function StandardModeView({
  day,
  exercises,
  overloads,
  unit,
  increments,
  wasGuidedMode,
  guidedCompleted,
  saving,
  notes,
  onNotesChange,
  onContinueGuided,
  onFinish,
  onEndSession,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onMarkDone,
  onRenameExercise,
}: StandardModeViewProps) {

  return (
    <>
      {/* Continue Guided Session — sticky top, only when not yet completed */}
      {wasGuidedMode && !guidedCompleted && (
        <div className="sticky top-0 z-40 bg-bg pb-2">
          <button
            onClick={onContinueGuided}
            className="w-full h-14 bg-accent text-bg font-medium rounded-lg text-base hover:opacity-90 transition-opacity"
          >
            Continue Guided Session
          </button>
        </div>
      )}

      {/* Exercise list */}
      {day.exercises.map((ex, exIdx) => {
        const ol = overloads[ex.id];
        const exState = exercises[exIdx];
        if (!exState) return null;

        return (
          <div key={ex.id} className="border border-border rounded p-3">
            <div className="flex justify-between items-baseline mb-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-medium">{ex.name}</h2>
                <button
                  onClick={() => onRenameExercise(ex.id, ex.name)}
                  className="text-muted hover:text-accent transition-colors p-0.5"
                  aria-label="Rename exercise"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
              <span className="text-muted text-xs">
                {ex.sets} &times; {ex.repRange[0]}–{ex.repRange[1]}
                <span className="ml-1 text-muted/50">{ex.rest}s rest</span>
              </span>
            </div>

            {ol?.lastWeight > 0 && (
              <div className="text-muted text-xs mb-2">
                Last: {kgToDisplay(ol.lastWeight, unit)} {unit} &times; [{ol.lastReps.join(", ")}]
              </div>
            )}

            {(ol?.status === "go_up" || ol?.status === "almost_ready") && (
              <OverloadBanner suggestedWeight={kgToDisplay(ol.suggestedWeight, unit)} unit={unit} variant={ol.status} />
            )}

            <div className="space-y-2 mb-2">
              <div className="flex items-center gap-1.5 text-muted text-[10px]">
                <span className="w-8 shrink-0" />
                <span className="w-full text-center">{unit.toUpperCase()}</span>
                <span className="w-full text-center">REPS</span>
                <span className="w-full text-center">RIR</span>
                <span className="w-6 shrink-0" />
              </div>
              {exState.sets.map((s, sIdx) => (
                <SetRow
                  key={sIdx}
                  index={sIdx}
                  data={s}
                  onChange={(d) => onUpdateSet(exIdx, sIdx, d)}
                  onRemove={
                    exState.sets.length > 1
                      ? () => onRemoveSet(exIdx, sIdx)
                      : undefined
                  }
                  onDone={() => onMarkDone(exIdx)}
                  increments={increments}
                  unitLabel={unit}
                  showIncrements={false}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => onAddSet(exIdx)}
              className="text-muted text-xs hover:text-accent"
            >
              + Add set
            </button>
          </div>
        );
      })}

      <div>
        <textarea
          placeholder="Session notes (optional)"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full h-20 bg-surface border border-border text-text text-sm rounded p-3 resize-none focus:border-accent focus:outline-none"
        />
      </div>

      {guidedCompleted ? (
        <button
          onClick={onFinish}
          disabled={saving}
          className="w-full h-12 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? "Saving..." : "Record Session"}
        </button>
      ) : wasGuidedMode ? (
        <button
          onClick={onEndSession}
          className="w-full h-12 border border-red-400 text-red-400 font-medium rounded text-sm hover:bg-red-400/10 transition-colors"
        >
          End Session
        </button>
      ) : (
        <button
          onClick={onFinish}
          disabled={saving}
          className="w-full h-12 bg-accent text-bg font-medium rounded text-sm hover:bg-white disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Finish Session"}
        </button>
      )}
    </>
  );
}
