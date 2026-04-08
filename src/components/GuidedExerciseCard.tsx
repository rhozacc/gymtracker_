"use client";

import { Exercise } from "@/lib/program";
import { OverloadResult } from "@/lib/overload";
import { type WeightUnit, kgToDisplay } from "@/lib/units";
import { SetRow, SetInput } from "@/components/SetRow";
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
}: GuidedExerciseCardProps) {
  return (
    <div className="flex flex-col items-center py-8 px-4">
      <p className="text-muted text-xs uppercase tracking-wide">Now</p>
      <h2 className="text-xl font-medium mt-1">{exercise.name}</h2>
      <p className="text-muted text-sm mt-1">
        Set {setIndex + 1} of {totalSets} &middot; {exercise.repRange[0]}–{exercise.repRange[1]} reps
      </p>

      {overload && overload.lastWeight > 0 && (
        <p className="text-muted text-xs mt-2">
          Last: {kgToDisplay(overload.lastWeight, unit)} {unit} &times; [{overload.lastReps.join(", ")}]
        </p>
      )}

      {overload?.ready && (
        <div className="mt-2 w-full max-w-xs">
          <OverloadBanner suggestedWeight={kgToDisplay(overload.suggestedWeight, unit)} unit={unit} />
        </div>
      )}

      <div className="w-full max-w-sm mt-6">
        <div className="flex items-center gap-1.5 text-muted text-[10px] mb-2">
          <span className="w-8 shrink-0" />
          <span className="w-full text-center">{unit.toUpperCase()}</span>
          <span className="w-full text-center">REPS</span>
          <span className="w-full text-center">RIR</span>
          <span className="w-6 shrink-0" />
        </div>
        <SetRow
          index={setIndex}
          data={setData}
          onChange={onChange}
          onDone={onDone}
          increments={increments}
          unitLabel={unit}
        />
      </div>

      <button
        onClick={onDone}
        className="mt-8 w-full max-w-sm h-14 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity"
      >
        Done — Start Rest
      </button>
    </div>
  );
}
