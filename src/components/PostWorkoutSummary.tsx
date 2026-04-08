"use client";

import { type WeightUnit, kgToDisplay } from "@/lib/units";
import { estimateE1RM } from "@/lib/e1rm";

interface WeightUp {
  name: string;
  from: number;
  to: number;
}

interface Props {
  durationMs: number;
  totalVolumeKg: number;
  setCount: number;
  exerciseCount: number;
  unit: WeightUnit;
  weightUps: WeightUp[];
  topE1rm: { name: string; value: number } | null;
}

function formatDur(ms: number) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatVol(kg: number, unit: WeightUnit) {
  const val = kgToDisplay(kg, unit);
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return Math.round(val).toString();
}

export function PostWorkoutSummary({
  durationMs,
  totalVolumeKg,
  setCount,
  exerciseCount,
  unit,
  weightUps,
  topE1rm,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div>
          <div className="text-lg font-semibold">{formatDur(durationMs)}</div>
          <div className="text-[10px] text-muted">duration</div>
        </div>
        <div>
          <div className="text-lg font-semibold">
            {formatVol(totalVolumeKg, unit)}
          </div>
          <div className="text-[10px] text-muted">volume ({unit})</div>
        </div>
        <div>
          <div className="text-lg font-semibold">{setCount}</div>
          <div className="text-[10px] text-muted">sets</div>
        </div>
        <div>
          <div className="text-lg font-semibold">{exerciseCount}</div>
          <div className="text-[10px] text-muted">exercises</div>
        </div>
      </div>

      {/* Top e1RM */}
      {topE1rm && (
        <div className="text-center text-xs text-muted">
          Top e1RM:{" "}
          <span className="text-text font-medium">
            {topE1rm.name} — {kgToDisplay(topE1rm.value, unit).toFixed(1)} {unit}
          </span>
        </div>
      )}

      {/* Weight-up badges */}
      {weightUps.length > 0 && (
        <div className="space-y-1.5">
          {weightUps.map((w) => (
            <div
              key={w.name}
              className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded px-3 py-2 text-sm"
            >
              <span className="text-accent font-medium text-xs">UP</span>
              <span className="flex-1 truncate">{w.name}</span>
              <span className="text-muted text-xs tabular-nums">
                {kgToDisplay(w.from, unit)} → {kgToDisplay(w.to, unit)} {unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Compute summary data from raw exercise/overload state */
export function computeSummary(
  exercises: { exerciseId: string; sets: { reps: string; weight: string }[] }[],
  overloads: Record<string, { lastWeight: number; status: string }>,
  exerciseLookup: Record<string, string>,
  startedAt: string,
  unit: WeightUnit,
  displayToKg: (val: number, u: WeightUnit) => number
) {
  const endedAt = Date.now();
  const durationMs = endedAt - new Date(startedAt).getTime();
  let totalVolumeKg = 0;
  let setCount = 0;
  let exerciseCount = 0;
  const weightUps: WeightUp[] = [];
  let topE1rm: { name: string; value: number } | null = null;

  for (const ex of exercises) {
    let exHasValidSet = false;
    let maxWeightKg = 0;

    for (const s of ex.sets) {
      const reps = parseInt(s.reps);
      const displayWeight = parseFloat(s.weight);
      if (isNaN(reps) || isNaN(displayWeight) || reps <= 0 || displayWeight <= 0)
        continue;
      const weightKg = displayToKg(displayWeight, unit);
      totalVolumeKg += reps * weightKg;
      setCount++;
      exHasValidSet = true;
      if (weightKg > maxWeightKg) maxWeightKg = weightKg;

      const e1rm = estimateE1RM(weightKg, reps);
      if (!topE1rm || e1rm > topE1rm.value) {
        topE1rm = { name: exerciseLookup[ex.exerciseId] || ex.exerciseId, value: e1rm };
      }
    }

    if (exHasValidSet) exerciseCount++;

    // Detect weight increases
    const ol = overloads[ex.exerciseId];
    if (ol && ol.lastWeight > 0 && maxWeightKg > ol.lastWeight) {
      weightUps.push({
        name: exerciseLookup[ex.exerciseId] || ex.exerciseId,
        from: ol.lastWeight,
        to: maxWeightKg,
      });
    }
  }

  return { durationMs, totalVolumeKg, setCount, exerciseCount, weightUps, topE1rm };
}
