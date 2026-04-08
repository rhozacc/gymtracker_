"use client";

import Link from "next/link";
import { useState } from "react";
import { useProgram } from "@/lib/useProgram";
import { useUnit } from "@/lib/useUnit";
import { PLANS } from "@/lib/program";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";

interface DbPlanRaw {
  slug: string;
  name: string;
  description: string;
  builtIn: boolean;
  days: Record<string, { label: string; exercises: { id: string }[] }>;
}

interface DbPlan extends DbPlanRaw {
  category: string;
  goal: string;
}

/** Merge category/goal from built-in PLANS constant onto DB results */
function enrichPlans(raw: DbPlanRaw[]): DbPlan[] {
  return raw.map((p) => {
    const builtIn = PLANS[p.slug];
    return {
      ...p,
      category: builtIn?.category || "",
      goal: builtIn?.goal || "",
    };
  });
}

const GOAL_STYLES: Record<string, { label: string; color: string }> = {
  bulk: { label: "Bulk", color: "text-orange-400 border-orange-400/40 bg-orange-400/10" },
  balanced: { label: "Balanced", color: "text-blue-400 border-blue-400/40 bg-blue-400/10" },
  lean: { label: "Lean", color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10" },
};

function GoalBadge({ goal }: { goal: string }) {
  const style = GOAL_STYLES[goal];
  if (!style) return null;
  return (
    <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${style.color}`}>
      {style.label}
    </span>
  );
}

function PlanCard({
  plan,
  active,
  onSelect,
  onDelete,
}: {
  plan: DbPlan;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const days = Object.values(plan.days);
  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        active
          ? "border-accent bg-surface"
          : "border-border hover:border-muted"
      }`}
    >
      <button onClick={onSelect} className="w-full text-left">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium">{plan.name}</h2>
          <div className="flex items-center gap-2">
            {plan.goal && <GoalBadge goal={plan.goal} />}
            {!plan.builtIn && (
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
        <p className="text-muted text-xs mb-3">{plan.description}</p>
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
                <span className="text-muted/60">{day.exercises.length}</span>
              </span>
            );
          })}
        </div>
      </button>

      {!plan.builtIn && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <Link
            href={`/plan/custom?edit=${plan.slug}`}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={onDelete}
            className="text-xs text-muted hover:text-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

type CategoryTab = "men" | "women" | "custom";

export default function PlanPage() {
  const { planId, plan, setPlan, refreshPlans } = useProgram();
  const { unit, setUnit } = useUnit();
  const { data: rawPlans, mutate } = useSWR<DbPlanRaw[]>("/api/plans", fetcher);
  const dbPlans = rawPlans ? enrichPlans(rawPlans) : undefined;

  // Auto-select tab based on active plan's category
  const initialTab: CategoryTab =
    plan.category === "women" ? "women" : plan.category === "men" ? "men" : "men";
  const [tab, setTab] = useState<CategoryTab>(initialTab);

  async function handleDelete(slug: string) {
    if (!confirm("Delete this custom plan?")) return;
    await fetch(`/api/plans/${slug}`, { method: "DELETE" });
    mutate();
    refreshPlans();
    if (planId === slug) setPlan("upper_lower");
  }

  const menPlans = dbPlans?.filter((p) => p.builtIn && p.category === "men") ?? [];
  const womenPlans = dbPlans?.filter((p) => p.builtIn && p.category === "women") ?? [];
  const customPlans = dbPlans?.filter((p) => !p.builtIn) ?? [];
  // Plans without a category (legacy) go into men's tab
  const uncategorized = dbPlans?.filter((p) => p.builtIn && !p.category) ?? [];
  const allMen = [...menPlans, ...uncategorized];

  const tabs: { key: CategoryTab; label: string }[] = [
    { key: "men", label: "Men's" },
    { key: "women", label: "Women's" },
    { key: "custom", label: "Custom" },
  ];

  function currentPlans(): DbPlan[] {
    if (tab === "men") return allMen;
    if (tab === "women") return womenPlans;
    return customPlans;
  }

  // Group plans by goal for display
  function groupByGoal(plans: DbPlan[]): { goal: string; plans: DbPlan[] }[] {
    const goalOrder = ["bulk", "balanced", "lean", ""];
    const groups: Record<string, DbPlan[]> = {};
    for (const p of plans) {
      const g = p.goal || "";
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    }
    return goalOrder
      .filter((g) => groups[g]?.length)
      .map((g) => ({ goal: g, plans: groups[g] }));
  }

  const goalLabels: Record<string, string> = {
    bulk: "Bulk — Build size & strength",
    balanced: "Balanced — Well-rounded training",
    lean: "Lean — Cut & define",
    "": "Other",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium">Training Plans</h1>
        <p className="text-muted text-xs mt-1">
          Pick your goal and split. History from other plans is always preserved.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 border border-border rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-xs py-2 rounded-md transition-colors ${
              tab === t.key
                ? "bg-surface text-accent font-medium"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {!dbPlans && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface rounded animate-pulse" />
          ))}
        </div>
      )}

      {/* Plan list grouped by goal */}
      {dbPlans && tab !== "custom" && (
        <div className="space-y-6">
          {groupByGoal(currentPlans()).map(({ goal, plans }) => (
            <div key={goal}>
              <div className="flex items-center gap-2 mb-3">
                {goal && <GoalBadge goal={goal} />}
                <span className="text-xs text-muted">
                  {goalLabels[goal] || goal}
                </span>
              </div>
              <div className="space-y-3">
                {plans.map((p) => (
                  <PlanCard
                    key={p.slug}
                    plan={p}
                    active={p.slug === planId}
                    onSelect={() => setPlan(p.slug)}
                    onDelete={() => handleDelete(p.slug)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom plans (ungrouped) */}
      {dbPlans && tab === "custom" && (
        <div className="space-y-3">
          {customPlans.length === 0 && (
            <p className="text-muted text-xs text-center py-4">
              No custom plans yet. Create one below!
            </p>
          )}
          {customPlans.map((p) => (
            <PlanCard
              key={p.slug}
              plan={p}
              active={p.slug === planId}
              onSelect={() => setPlan(p.slug)}
              onDelete={() => handleDelete(p.slug)}
            />
          ))}
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
