"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { MUSCLE_GROUPS, MuscleGroup } from "@/lib/muscleGroups";

interface Contribution {
  id: string;
  muscleGroup: string;
  weight: number;
}

interface Exercise {
  id: string;
  name: string;
  contributions: Contribution[];
}

function primaryGroup(ex: Exercise): MuscleGroup {
  if (ex.contributions.length === 0) return "Chest";
  const top = ex.contributions.reduce((a, b) => (a.weight >= b.weight ? a : b));
  return top.muscleGroup as MuscleGroup;
}

function ContributionBar({ contributions }: { contributions: Contribution[] }) {
  if (contributions.length === 0) {
    return <span className="text-[11px] text-muted italic">No contributions set</span>;
  }
  const sorted = [...contributions].sort((a, b) => b.weight - a.weight);
  return (
    <span className="text-[11px] text-muted">
      {sorted.map((c, i) => (
        <span key={c.muscleGroup}>
          {i > 0 && " · "}
          <span className="text-text">{c.muscleGroup}</span>{" "}
          {Math.round(c.weight * 100)}%
        </span>
      ))}
    </span>
  );
}

function EditRow({
  exercise,
  onSave,
}: {
  exercise: Exercise;
  onSave: (contributions: { muscleGroup: string; weight: number }[]) => Promise<void>;
}) {
  const initial: Record<MuscleGroup, string> = {} as Record<MuscleGroup, string>;
  for (const mg of MUSCLE_GROUPS) {
    const existing = exercise.contributions.find((c) => c.muscleGroup === mg);
    initial[mg] = existing ? String(Math.round(existing.weight * 100)) : "0";
  }

  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = MUSCLE_GROUPS.reduce((s, mg) => s + (parseInt(values[mg]) || 0), 0);

  async function handleSave() {
    if (total !== 100) { setError(`Sum must be 100 (currently ${total})`); return; }
    setSaving(true);
    setError("");
    const contributions = MUSCLE_GROUPS
      .filter((mg) => parseInt(values[mg]) > 0)
      .map((mg) => ({ muscleGroup: mg, weight: (parseInt(values[mg]) || 0) / 100 }));
    await onSave(contributions);
    setSaving(false);
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="grid grid-cols-5 gap-2">
        {MUSCLE_GROUPS.map((mg) => (
          <div key={mg} className="flex flex-col gap-1">
            <label className="text-[10px] text-muted uppercase tracking-widest">{mg}</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={values[mg]}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, [mg]: e.target.value }));
                  setError("");
                }}
                className="w-full h-8 bg-bg border border-border text-text text-sm rounded px-2 pr-5 focus:border-accent focus:outline-none"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted pointer-events-none">%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[11px] ${total === 100 ? "text-muted" : "text-red-400"}`}>
          Total: {total}%
        </span>
        {error && <span className="text-[11px] text-red-400">{error}</span>}
        <button
          onClick={handleSave}
          disabled={saving || total !== 100}
          className="ml-auto h-7 px-4 bg-accent text-bg text-xs font-medium rounded disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function AdminExercisesPage() {
  const { data: session } = authClient.useSession();
  const isOwner = session?.user?.email === process.env.NEXT_PUBLIC_OWNER_EMAIL;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner) return;
    fetch("/api/admin/exercise-contributions")
      .then((r) => r.json())
      .then((data) => { setExercises(data); setLoading(false); });
  }, [isOwner]);

  async function handleSave(exerciseId: string, contributions: { muscleGroup: string; weight: number }[]) {
    await fetch("/api/admin/exercise-contributions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId, contributions }),
    });
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, contributions: contributions.map((c, i) => ({ id: String(i), ...c })) }
          : ex
      )
    );
    setEditingId(null);
  }

  if (session === undefined) return null;
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-muted text-sm">Access denied.</p>
      </div>
    );
  }

  const grouped = MUSCLE_GROUPS.reduce((acc, mg) => {
    acc[mg] = exercises.filter((ex) => primaryGroup(ex) === mg);
    return acc;
  }, {} as Record<MuscleGroup, Exercise[]>);

  const unassigned = exercises.filter((ex) => ex.contributions.length === 0);

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-muted hover:text-text transition-colors text-sm">
            ← Settings
          </Link>
          <h1 className="text-base font-medium">Muscle contribution editor</h1>
        </div>
        <p className="text-[11px] text-muted">
          Each exercise distributes set credit across muscle groups. Weights must sum to 100%.
          Changes apply to the radar chart immediately.
        </p>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-surface rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {MUSCLE_GROUPS.map((mg) => {
              const group = grouped[mg];
              if (group.length === 0) return null;
              return (
                <div key={mg}>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-2">
                    {mg}
                  </p>
                  <div className="border border-border rounded divide-y divide-border">
                    {group.map((ex) => (
                      <div key={ex.id} className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{ex.name}</p>
                            <ContributionBar contributions={ex.contributions} />
                          </div>
                          <button
                            onClick={() => setEditingId(editingId === ex.id ? null : ex.id)}
                            className="shrink-0 text-[11px] text-muted hover:text-accent transition-colors"
                          >
                            {editingId === ex.id ? "Cancel" : "Edit"}
                          </button>
                        </div>
                        {editingId === ex.id && (
                          <EditRow
                            exercise={ex}
                            onSave={(contribs) => handleSave(ex.id, contribs)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {unassigned.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-2">
                  Unassigned
                </p>
                <div className="border border-border rounded divide-y divide-border">
                  {unassigned.map((ex) => (
                    <div key={ex.id} className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{ex.name}</p>
                          <ContributionBar contributions={ex.contributions} />
                        </div>
                        <button
                          onClick={() => setEditingId(editingId === ex.id ? null : ex.id)}
                          className="shrink-0 text-[11px] text-muted hover:text-accent transition-colors"
                        >
                          {editingId === ex.id ? "Cancel" : "Edit"}
                        </button>
                      </div>
                      {editingId === ex.id && (
                        <EditRow
                          exercise={ex}
                          onSave={(contribs) => handleSave(ex.id, contribs)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
