"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Exercise } from "@/lib/program";

interface DayState {
  key: string;
  label: string;
  exercises: ExerciseState[];
}

interface ExerciseState {
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  rest: number;
}

const DEFAULT_EXERCISE: ExerciseState = {
  name: "",
  sets: 3,
  repMin: 8,
  repMax: 12,
  rest: 90,
};

const REST_OPTIONS = [
  { label: "60s", value: 60 },
  { label: "90s", value: 90 },
  { label: "120s", value: 120 },
  { label: "180s", value: 180 },
  { label: "240s", value: 240 },
  { label: "300s", value: 300 },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function CustomPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");

  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [days, setDays] = useState<DayState[]>([
    { key: "", label: "", exercises: [{ ...DEFAULT_EXERCISE }] },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editSlug) return;
    fetch("/api/plans")
      .then((r) => r.json())
      .then((plans) => {
        const plan = plans.find((p: { slug: string }) => p.slug === editSlug);
        if (!plan) return;
        setPlanName(plan.name);
        setPlanDescription(plan.description);
        setDays(
          Object.entries(plan.days).map(([key, day]: [string, any]) => ({
            key,
            label: day.label.includes("—") ? day.label.split("—")[1].trim() : day.label,
            exercises: day.exercises.map((ex: Exercise) => ({
              name: ex.name,
              sets: ex.sets,
              repMin: ex.repRange[0],
              repMax: ex.repRange[1],
              rest: ex.rest,
            })),
          }))
        );
      });
  }, [editSlug]);

  function addDay() {
    setDays((d) => [
      ...d,
      { key: "", label: "", exercises: [{ ...DEFAULT_EXERCISE }] },
    ]);
  }

  function removeDay(idx: number) {
    if (days.length <= 1) return;
    setDays((d) => d.filter((_, i) => i !== idx));
  }

  function updateDay(idx: number, field: "label", value: string) {
    setDays((d) => {
      const next = [...d];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function addExercise(dayIdx: number) {
    setDays((d) => {
      const next = [...d];
      next[dayIdx] = {
        ...next[dayIdx],
        exercises: [...next[dayIdx].exercises, { ...DEFAULT_EXERCISE }],
      };
      return next;
    });
  }

  function removeExercise(dayIdx: number, exIdx: number) {
    setDays((d) => {
      const next = [...d];
      if (next[dayIdx].exercises.length <= 1) return d;
      next[dayIdx] = {
        ...next[dayIdx],
        exercises: next[dayIdx].exercises.filter((_, i) => i !== exIdx),
      };
      return next;
    });
  }

  function updateExercise(
    dayIdx: number,
    exIdx: number,
    field: keyof ExerciseState,
    value: string | number
  ) {
    setDays((d) => {
      const next = [...d];
      next[dayIdx] = {
        ...next[dayIdx],
        exercises: next[dayIdx].exercises.map((ex, i) =>
          i === exIdx ? { ...ex, [field]: value } : ex
        ),
      };
      return next;
    });
  }

  function moveExercise(dayIdx: number, exIdx: number, dir: -1 | 1) {
    setDays((d) => {
      const next = [...d];
      const exs = [...next[dayIdx].exercises];
      const target = exIdx + dir;
      if (target < 0 || target >= exs.length) return d;
      [exs[exIdx], exs[target]] = [exs[target], exs[exIdx]];
      next[dayIdx] = { ...next[dayIdx], exercises: exs };
      return next;
    });
  }

  function isValid(): boolean {
    if (!planName.trim()) return false;
    for (const day of days) {
      if (!day.label.trim()) return false;
      for (const ex of day.exercises) {
        if (!ex.name.trim()) return false;
      }
    }
    return true;
  }

  async function save() {
    if (!isValid() || saving) return;
    setSaving(true);

    const planSlug = editSlug || `custom_${slugify(planName)}_${Date.now().toString(36)}`;

    const planDays: Record<string, any> = {};
    days.forEach((day, i) => {
      const dayKey = editSlug && day.key
        ? day.key
        : `${slugify(planSlug)}_day${i + 1}`;

      const exercises: Exercise[] = day.exercises.map((ex) => ({
        id: `${dayKey}_${slugify(ex.name)}`,
        name: ex.name,
        sets: ex.sets,
        repRange: [ex.repMin, ex.repMax] as [number, number],
        increment: 2.5,
        rest: ex.rest,
      }));

      planDays[dayKey] = {
        label: `Day ${i + 1} — ${day.label}`,
        exercises,
      };
    });

    if (editSlug) {
      await fetch(`/api/plans/${editSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName.trim(),
          description: planDescription.trim() || "Custom plan",
          days: planDays,
        }),
      });
    } else {
      await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: planSlug,
          name: planName.trim(),
          description: planDescription.trim() || "Custom plan",
          days: planDays,
        }),
      });
    }

    setSaving(false);
    router.push("/plan");
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <button
          onClick={() => router.back()}
          className="text-muted text-sm mb-2 hover:text-accent"
        >
          &larr; Back
        </button>
        <h1 className="text-lg font-medium">
          {editSlug ? "Edit Plan" : "Create Plan"}
        </h1>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Plan name"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          className="w-full h-10 bg-surface border border-border text-accent text-sm rounded px-3 focus:border-accent focus:outline-none"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={planDescription}
          onChange={(e) => setPlanDescription(e.target.value)}
          className="w-full h-10 bg-surface border border-border text-accent text-sm rounded px-3 focus:border-accent focus:outline-none"
        />
      </div>

      {days.map((day, dayIdx) => (
        <div key={dayIdx} className="border border-border rounded p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-muted text-xs shrink-0">Day {dayIdx + 1}</span>
            <input
              type="text"
              placeholder="e.g. Upper Body"
              value={day.label}
              onChange={(e) => updateDay(dayIdx, "label", e.target.value)}
              className="flex-1 h-9 bg-surface border border-border text-accent text-sm rounded px-3 focus:border-accent focus:outline-none"
            />
            {days.length > 1 && (
              <button
                onClick={() => removeDay(dayIdx)}
                className="text-muted hover:text-red-500 text-sm shrink-0 px-1"
              >
                ×
              </button>
            )}
          </div>

          {day.exercises.map((ex, exIdx) => (
            <div
              key={exIdx}
              className="border border-border/50 rounded p-3 space-y-2"
            >
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => moveExercise(dayIdx, exIdx, -1)}
                    disabled={exIdx === 0}
                    className="text-[10px] text-muted hover:text-accent disabled:opacity-20 leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveExercise(dayIdx, exIdx, 1)}
                    disabled={exIdx === day.exercises.length - 1}
                    className="text-[10px] text-muted hover:text-accent disabled:opacity-20 leading-none"
                  >
                    ▼
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Exercise name"
                  value={ex.name}
                  onChange={(e) =>
                    updateExercise(dayIdx, exIdx, "name", e.target.value)
                  }
                  className="flex-1 h-9 bg-bg border border-border text-accent text-sm rounded px-2 focus:border-accent focus:outline-none"
                />
                {day.exercises.length > 1 && (
                  <button
                    onClick={() => removeExercise(dayIdx, exIdx)}
                    className="text-muted hover:text-red-500 text-sm shrink-0 px-1"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-muted block mb-0.5">
                    Sets
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={ex.sets}
                    onChange={(e) =>
                      updateExercise(
                        dayIdx,
                        exIdx,
                        "sets",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-full h-8 bg-bg border border-border text-accent text-center text-xs rounded focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted block mb-0.5">
                    Rep min
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={ex.repMin}
                    onChange={(e) =>
                      updateExercise(
                        dayIdx,
                        exIdx,
                        "repMin",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-full h-8 bg-bg border border-border text-accent text-center text-xs rounded focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted block mb-0.5">
                    Rep max
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={ex.repMax}
                    onChange={(e) =>
                      updateExercise(
                        dayIdx,
                        exIdx,
                        "repMax",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-full h-8 bg-bg border border-border text-accent text-center text-xs rounded focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted block mb-0.5">
                    Rest
                  </label>
                  <select
                    value={ex.rest}
                    onChange={(e) =>
                      updateExercise(
                        dayIdx,
                        exIdx,
                        "rest",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full h-8 bg-bg border border-border text-accent text-center text-xs rounded focus:border-accent focus:outline-none appearance-none"
                  >
                    {REST_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => addExercise(dayIdx)}
            className="text-muted text-xs hover:text-accent"
          >
            + Add exercise
          </button>
        </div>
      ))}

      <button
        onClick={addDay}
        className="w-full h-10 border border-dashed border-border rounded text-sm text-muted hover:border-muted hover:text-accent transition-colors"
      >
        + Add day
      </button>

      <button
        onClick={save}
        disabled={!isValid() || saving}
        className="w-full h-12 bg-accent text-bg font-medium rounded text-sm hover:bg-white disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving..." : editSlug ? "Save Changes" : "Create Plan"}
      </button>
    </div>
  );
}
