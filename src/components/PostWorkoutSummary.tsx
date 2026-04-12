"use client";

import { useState, useEffect } from "react";
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

/** Count from 0 to target with ease-out cubic over `duration` ms. */
function useCountUp(target: number, duration = 700): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const startTime = performance.now();
    let raf: number;
    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/**
 * Slot-machine roll: cycles fake values for ~480 ms then lands on the real one.
 * Returns a formatted display string so the caller just renders it.
 */
function useE1rmRoll(targetKg: number | null, unit: WeightUnit): string {
  const target = targetKg ? kgToDisplay(targetKg, unit) : 0;
  const [display, setDisplay] = useState("—");
  useEffect(() => {
    if (!target) return;
    const endTime = Date.now() + 480;
    let tid: ReturnType<typeof setTimeout>;
    function roll() {
      if (Date.now() < endTime) {
        const fake = target * (0.65 + Math.random() * 0.55);
        setDisplay(fake.toFixed(1));
        tid = setTimeout(roll, 55);
      } else {
        setDisplay(target.toFixed(1));
      }
    }
    tid = setTimeout(roll, 100); // slight delay so stat count-ups start first
    return () => clearTimeout(tid);
  }, [target]);
  return display;
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
  const durMs      = useCountUp(durationMs,    700);
  const volKg      = useCountUp(totalVolumeKg, 700);
  const sets       = useCountUp(setCount,      600);
  const exercises  = useCountUp(exerciseCount, 500);
  const e1rmDisplay = useE1rmRoll(topE1rm?.value ?? null, unit);

  return (
    <div className="space-y-4">
      {/* Stats row — numbers count up from 0 */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div>
          <div className="text-lg font-semibold tabular-nums">{formatDur(durMs)}</div>
          <div className="text-[10px] text-muted">duration</div>
        </div>
        <div>
          <div className="text-lg font-semibold tabular-nums">
            {formatVol(volKg, unit)}
          </div>
          <div className="text-[10px] text-muted">volume ({unit})</div>
        </div>
        <div>
          <div className="text-lg font-semibold tabular-nums">{sets}</div>
          <div className="text-[10px] text-muted">sets</div>
        </div>
        <div>
          <div className="text-lg font-semibold tabular-nums">{exercises}</div>
          <div className="text-[10px] text-muted">exercises</div>
        </div>
      </div>

      {/* Top e1RM — slot-machine roll */}
      {topE1rm && (
        <div className="text-center text-xs text-muted">
          Top e1RM:{" "}
          <span className="text-text font-medium tabular-nums">
            {topE1rm.name} — {e1rmDisplay} {unit}
          </span>
        </div>
      )}

      {/* Weight-up badges — stagger in after stats finish */}
      {weightUps.length > 0 && (
        <div className="space-y-1.5">
          {weightUps.map((w, idx) => (
            <div
              key={w.name}
              className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded px-3 py-2 text-sm"
              style={{
                opacity: 0,
                animation: "fade-in-up 350ms ease-out forwards",
                animationDelay: `${400 + idx * 80}ms`,
              }}
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
