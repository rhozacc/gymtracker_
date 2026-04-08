"use client";

import Link from "next/link";
import { useProgram } from "@/lib/useProgram";
import { useUnit } from "@/lib/useUnit";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";

interface DbPlan {
  slug: string;
  name: string;
  description: string;
  builtIn: boolean;
  days: Record<string, { label: string; exercises: { id: string }[] }>;
}

export default function PlanPage() {
  const { planId, setPlan, refreshPlans } = useProgram();
  const { unit, setUnit } = useUnit();
  const { data: dbPlans, mutate } = useSWR<DbPlan[]>("/api/plans", fetcher);

  async function handleDelete(slug: string) {
    if (!confirm("Delete this custom plan?")) return;
    await fetch(`/api/plans/${slug}`, { method: "DELETE" });
    mutate();
    refreshPlans();
    if (planId === slug) setPlan("upper_lower");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium">Training Plan</h1>
        <p className="text-muted text-xs mt-1">
          Choose your split. History from other plans is always preserved.
        </p>
      </div>

      {!dbPlans && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface rounded animate-pulse" />
          ))}
        </div>
      )}

      {dbPlans && (
        <div className="space-y-3">
          {dbPlans.map((p) => {
            const active = p.slug === planId;
            const days = Object.values(p.days);

            return (
              <div
                key={p.slug}
                className={`border rounded p-4 transition-colors ${
                  active
                    ? "border-accent bg-surface"
                    : "border-border hover:border-muted"
                }`}
              >
                <button
                  onClick={() => setPlan(p.slug)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-sm font-medium">{p.name}</h2>
                    <div className="flex items-center gap-2">
                      {!p.builtIn && (
                        <span className="text-[10px] text-muted border border-border rounded-full px-2 py-0.5">
                          Custom
                        </span>
                      )}
                      {active && (
                        <span className="text-[10px] text-accent border border-accent rounded-full px-2 py-0.5">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-muted text-xs mb-3">{p.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {days.map((day) => {
                      const shortLabel = day.label.includes("—")
                        ? day.label.split("—")[1].trim()
                        : day.label;
                      return (
                        <span
                          key={day.label}
                          className="text-[10px] text-muted bg-bg border border-border rounded px-2 py-0.5"
                        >
                          {shortLabel}{" "}
                          <span className="text-muted/60">
                            {day.exercises.length}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </button>

                {!p.builtIn && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <Link
                      href={`/plan/custom?edit=${p.slug}`}
                      className="text-xs text-muted hover:text-accent transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.slug)}
                      className="text-xs text-muted hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/plan/custom"
        className="flex items-center justify-center w-full h-10 border border-dashed border-border rounded text-sm text-muted hover:border-muted hover:text-accent transition-colors"
      >
        + Create custom plan
      </Link>

      <div className="border-t border-border pt-6">
        <h2 className="text-sm font-medium mb-2">What is RIR?</h2>
        <p className="text-muted text-xs leading-relaxed">
          <span className="text-accent font-medium">RIR (Reps in Reserve)</span> is
          how many more reps you could have done before failure. RIR 0 means you
          hit failure, RIR 2 means you had 2 reps left in the tank. Tracking RIR
          helps gauge effort so you can progressively push closer to failure over
          time without always training to it.
        </p>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-sm font-medium mb-2">Weight Unit</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setUnit("kg")}
            className={`px-4 py-2 rounded text-sm border transition-colors ${
              unit === "kg"
                ? "border-accent bg-surface text-accent"
                : "border-border text-muted hover:border-muted"
            }`}
          >
            KG
          </button>
          <button
            onClick={() => setUnit("lbs")}
            className={`px-4 py-2 rounded text-sm border transition-colors ${
              unit === "lbs"
                ? "border-accent bg-surface text-accent"
                : "border-border text-muted hover:border-muted"
            }`}
          >
            LBS
          </button>
        </div>
        <p className="text-muted text-xs mt-2">
          All data is stored in kg. Display values are converted.
        </p>
      </div>
    </div>
  );
}
