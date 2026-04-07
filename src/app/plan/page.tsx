"use client";

import { PLANS } from "@/lib/program";
import { useProgram } from "@/lib/useProgram";

export default function PlanPage() {
  const { planId, setPlan } = useProgram();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium">Training Plan</h1>
        <p className="text-muted text-xs mt-1">
          Choose your split. History from other plans is always preserved.
        </p>
      </div>

      <div className="space-y-3">
        {Object.values(PLANS).map((p) => {
          const active = p.id === planId;
          const days = Object.values(p.days);

          return (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              className={`w-full text-left border rounded p-4 transition-colors ${
                active
                  ? "border-accent bg-surface"
                  : "border-border hover:border-muted"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-medium">{p.name}</h2>
                {active && (
                  <span className="text-[10px] text-accent border border-accent rounded-full px-2 py-0.5">
                    Active
                  </span>
                )}
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
          );
        })}
      </div>
    </div>
  );
}
