"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PROGRAM } from "@/lib/program";
import { checkOverload, OverloadResult } from "@/lib/overload";
import { SetRow, SetInput } from "@/components/SetRow";
import { OverloadBanner } from "@/components/OverloadBanner";

interface ExerciseState {
  exerciseId: string;
  sets: SetInput[];
}

export default function LogPage() {
  const router = useRouter();
  const params = useParams();
  const dayType = params.dayType as string;
  const day = PROGRAM[dayType];

  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [overloads, setOverloads] = useState<Record<string, OverloadResult>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!day) return;

    // Initialize exercise state
    setExercises(
      day.exercises.map((ex) => ({
        exerciseId: ex.id,
        sets: Array.from({ length: ex.sets }, () => ({
          reps: "",
          weight: "",
          rir: "",
        })),
      }))
    );

    // Fetch overload data for each exercise
    async function fetchOverloads() {
      const results: Record<string, OverloadResult> = {};
      await Promise.all(
        day.exercises.map(async (ex) => {
          const res = await fetch(`/api/sets/${ex.id}`);
          const lastSets = await res.json();
          const result = checkOverload(ex, lastSets);
          results[ex.id] = result;
        })
      );
      setOverloads(results);

      // Pre-fill weights from last session
      setExercises((prev) =>
        prev.map((exState) => {
          const ol = results[exState.exerciseId];
          if (!ol || ol.lastWeight === 0) return exState;
          const prefillWeight = ol.ready
            ? ol.suggestedWeight.toString()
            : ol.lastWeight.toString();
          return {
            ...exState,
            sets: exState.sets.map((s) => ({
              ...s,
              weight: s.weight || prefillWeight,
            })),
          };
        })
      );
    }
    fetchOverloads();
  }, [day, dayType]);

  if (!day) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Unknown day type: {dayType}</p>
      </div>
    );
  }

  function updateSet(exIdx: number, setIdx: number, data: SetInput) {
    setExercises((prev) => {
      const next = [...prev];
      next[exIdx] = {
        ...next[exIdx],
        sets: [...next[exIdx].sets],
      };
      next[exIdx].sets[setIdx] = data;
      return next;
    });
  }

  function addSet(exIdx: number) {
    setExercises((prev) => {
      const next = [...prev];
      const lastSet = next[exIdx].sets[next[exIdx].sets.length - 1];
      next[exIdx] = {
        ...next[exIdx],
        sets: [
          ...next[exIdx].sets,
          { reps: "", weight: lastSet?.weight || "", rir: "" },
        ],
      };
      return next;
    });
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExercises((prev) => {
      const next = [...prev];
      if (next[exIdx].sets.length <= 1) return prev;
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.filter((_, i) => i !== setIdx),
      };
      return next;
    });
  }

  async function finish() {
    const allSets: {
      exerciseId: string;
      setNumber: number;
      reps: number;
      weight: number;
      rir?: number;
    }[] = [];

    for (const ex of exercises) {
      let setNum = 1;
      for (const s of ex.sets) {
        const reps = parseInt(s.reps);
        const weight = parseFloat(s.weight);
        if (isNaN(reps) || isNaN(weight) || reps <= 0 || weight <= 0) continue;
        allSets.push({
          exerciseId: ex.exerciseId,
          setNumber: setNum++,
          reps,
          weight,
          rir: s.rir ? parseInt(s.rir) : undefined,
        });
      }
    }

    if (allSets.length === 0) return;

    setSaving(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString(),
        dayType,
        notes: notes.trim() || undefined,
        sets: allSets,
      }),
    });

    if (res.ok) {
      const { id } = await res.json();
      router.push(`/history/${id}`);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-muted text-sm mb-2 hover:text-accent"
        >
          &larr; Back
        </button>
        <h1 className="text-lg font-medium">{day.label}</h1>
      </div>

      {day.exercises.map((ex, exIdx) => {
        const ol = overloads[ex.id];
        const exState = exercises[exIdx];
        if (!exState) return null;

        return (
          <div key={ex.id} className="border border-border rounded p-3">
            <div className="flex justify-between items-baseline mb-1">
              <h2 className="text-sm font-medium">{ex.name}</h2>
              <span className="text-muted text-xs">
                {ex.sets} &times; {ex.repRange[0]}–{ex.repRange[1]}
              </span>
            </div>

            {ol?.lastWeight > 0 && (
              <div className="text-muted text-xs mb-2">
                Last: {ol.lastWeight} kg &times; [{ol.lastReps.join(", ")}]
              </div>
            )}

            {ol?.ready && (
              <OverloadBanner suggestedWeight={ol.suggestedWeight} />
            )}

            <div className="space-y-2 mb-2">
              <div className="flex items-center gap-2 text-muted text-[10px]">
                <span className="w-6" />
                <span className="w-full text-center">KG</span>
                <span className="w-full text-center">REPS</span>
                <span className="w-full text-center">RIR</span>
                {exState.sets.length > 1 && <span className="w-6" />}
              </div>
              {exState.sets.map((s, sIdx) => (
                <SetRow
                  key={sIdx}
                  index={sIdx}
                  data={s}
                  onChange={(d) => updateSet(exIdx, sIdx, d)}
                  onRemove={
                    exState.sets.length > 1
                      ? () => removeSet(exIdx, sIdx)
                      : undefined
                  }
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => addSet(exIdx)}
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
          onChange={(e) => setNotes(e.target.value)}
          className="w-full h-20 bg-surface border border-border text-accent text-sm rounded p-3 resize-none focus:border-accent focus:outline-none"
        />
      </div>

      <button
        onClick={finish}
        disabled={saving}
        className="w-full h-12 bg-accent text-bg font-medium rounded text-sm hover:bg-white disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving..." : "Finish Session"}
      </button>
    </div>
  );
}
