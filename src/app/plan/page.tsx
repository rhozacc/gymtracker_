"use client";

import Link from "next/link";
import { useState } from "react";
import { useProgram } from "@/lib/useProgram";
import { useUnit } from "@/lib/useUnit";
import { useExtras } from "@/lib/useExtras";
import { PLANS, type Exercise } from "@/lib/program";
import { usePlansSWR } from "@/lib/swr-hooks";
import type { ApiPlan as DbPlanRaw } from "@/lib/db-types";

interface DbPlanDay {
  label: string;
  exercises: Exercise[];
}

interface DbPlan {
  slug: string;
  name: string;
  description: string;
  fit: string;
  builtIn: boolean;
  category: string;
  goal: string;
  days: Record<string, DbPlanDay>;
}

/** Merge category/goal/fit and full exercise data from built-in PLANS */
function enrichPlans(raw: DbPlanRaw[]): DbPlan[] {
  return raw.map((p) => {
    const builtIn = PLANS[p.slug];
    // For built-in plans, use the full PLANS data (has sets/reps/etc)
    // For custom plans, map exercises with defaults
    const days: Record<string, DbPlanDay> = {};
    for (const [key, day] of Object.entries(p.days)) {
      if (builtIn?.days[key]) {
        days[key] = builtIn.days[key];
      } else {
        days[key] = {
          label: day.label,
          exercises: day.exercises.map((e: Record<string, unknown>) => ({
            id: (e.id as string) || "",
            name: (e.name as string) || (e.id as string || "").replace(/_/g, " "),
            sets: (e.sets as number) || 3,
            repRange: (e.repRange as [number, number]) || [8, 12],
            increment: (e.increment as number) ?? 2.5,
            rest: (e.rest as number) || 60,
          })),
        };
      }
    }
    return {
      slug: p.slug,
      name: p.name,
      description: p.description,
      fit: builtIn?.fit || "",
      builtIn: p.builtIn,
      category: builtIn?.category || "",
      goal: builtIn?.goal || "",
      days,
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
  expanded,
  onToggle,
  onSelect,
  onDelete,
}: {
  plan: DbPlan;
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const days = Object.values(plan.days);

  return (
    <div
      className={`border rounded-lg transition-colors ${
        active
          ? "border-accent bg-surface"
          : "border-border hover:border-muted"
      }`}
    >
      {/* Header — tap to expand/collapse */}
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium">{plan.name}</h2>
          <div className="flex items-center gap-2">
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
            <span className={`text-muted text-xs transition-transform ${expanded ? "rotate-180" : ""}`}>
              ▾
            </span>
          </div>
        </div>
        <p className="text-muted text-xs">{plan.description}</p>
        {plan.fit && (
          <p className="text-xs text-foreground/70 mt-1">{plan.fit}</p>
        )}
        {!expanded && (
          <div className="flex flex-wrap gap-2 mt-2">
            {days.map((day) => {
              const shortLabel = day.label.includes("—")
                ? day.label.split("—")[1].trim()
                : day.label;
              return (
                <span
                  key={day.label}
                  className="text-[10px] text-muted bg-bg border border-border rounded px-2 py-0.5"
                >
                  {shortLabel}
                </span>
              );
            })}
          </div>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Day-by-day exercises */}
          {days.map((day) => {
            const shortLabel = day.label.includes("—")
              ? day.label.split("—")[1].trim()
              : day.label;
            return (
              <div key={day.label}>
                <div className="text-xs font-medium text-muted mb-2">
                  {shortLabel}
                </div>
                <div className="space-y-1">
                  {day.exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <span className="text-foreground/90">{ex.name}</span>
                      <span className="text-muted tabular-nums">
                        {ex.sets} x {ex.repRange[0]}–{ex.repRange[1]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            {active ? (
              <span className="text-xs text-accent font-medium py-1.5">
                Currently active
              </span>
            ) : (
              <button
                onClick={onSelect}
                className="text-xs font-medium text-accent border border-accent rounded-md px-3 py-1.5 hover:bg-accent/10 transition-colors"
              >
                Use this plan
              </button>
            )}
            {!plan.builtIn && (
              <>
                <Link
                  href={`/plan/custom?edit=${plan.slug}`}
                  className="text-xs text-muted hover:text-accent transition-colors ml-auto"
                >
                  Edit
                </Link>
                <button
                  onClick={onDelete}
                  className="text-xs text-muted hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type CategoryTab = "men" | "women" | "custom";

export default function PlanPage() {
  const { planId, plan, setPlan, refreshPlans } = useProgram();
  const { unit, setUnit } = useUnit();
  const { selectedExtras } = useExtras();
  const { data: rawPlans, mutate } = usePlansSWR();
  const dbPlans = rawPlans ? enrichPlans(rawPlans) : undefined;

  const initialTab: CategoryTab =
    plan.category === "women" ? "women" : plan.category === "men" ? "men" : "men";
  const [tab, setTab] = useState<CategoryTab>(initialTab);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const [showWarmupPrefs, setShowWarmupPrefs] = useState(false);
  const [showExtrasVibes, setShowExtrasVibes] = useState(false);
  const [warmupPrefs, setWarmupPrefs] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("gym-warmup-prefs") || "{}"); } catch { return {}; }
  });
  const [extrasVibes, setExtrasVibes] = useState<{
    categoryBias: "none" | "abs" | "cardio" | "stretch";
    duration: "any" | "quick" | "longer";
  }>(() => {
    if (typeof window === "undefined") return { categoryBias: "none", duration: "any" };
    try {
      const raw = JSON.parse(localStorage.getItem("gym-extras-vibes") || "{}");
      return { categoryBias: raw.categoryBias || "none", duration: raw.duration || "any" };
    } catch { return { categoryBias: "none", duration: "any" }; }
  });

  function toggleExpand(slug: string) {
    setExpandedSlug((prev) => (prev === slug ? null : slug));
  }

  function toggleWarmupPref(exerciseId: string) {
    const current = warmupPrefs[exerciseId] !== false; // default true
    const next = { ...warmupPrefs, [exerciseId]: !current };
    setWarmupPrefs(next);
    localStorage.setItem("gym-warmup-prefs", JSON.stringify(next));
  }

  function updateVibes(update: Partial<typeof extrasVibes>) {
    const next = { ...extrasVibes, ...update };
    setExtrasVibes(next);
    localStorage.setItem("gym-extras-vibes", JSON.stringify(next));
  }

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
    bulk: "Build size & strength",
    balanced: "Well-rounded training",
    lean: "Cut & define",
    "": "Other",
  };

  function renderPlans(plans: DbPlan[]) {
    return plans.map((p) => (
      <PlanCard
        key={p.slug}
        plan={p}
        active={p.slug === planId}
        expanded={expandedSlug === p.slug}
        onToggle={() => toggleExpand(p.slug)}
        onSelect={() => setPlan(p.slug)}
        onDelete={() => handleDelete(p.slug)}
      />
    ));
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Link href="/" className="text-muted hover:text-text transition-colors" aria-label="Back to home">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4L6 9l5 5"/>
            </svg>
          </Link>
          <h1 className="text-lg font-medium">Your Current Plan</h1>
        </div>
        <p className="text-muted text-xs mt-1">
          Your plan data is stored and synced for you. Extras are part of your plan.
        </p>
      </div>

      {/* ── Current Plan ── */}
      {dbPlans && (() => {
        const activePlan = dbPlans.find((p) => p.slug === planId);
        if (!activePlan) return null;
        const days = Object.values(activePlan.days);
        return (
          <div className="border border-accent rounded-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted">Active</p>
                  {!activePlan.builtIn && (
                    <span className="text-[10px] text-accent border border-accent/50 rounded-full px-2 py-0.5">
                      Customized
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {activePlan.goal && <GoalBadge goal={activePlan.goal} />}
                  <Link
                    href={
                      activePlan.builtIn
                        ? `/plan/custom?fork=${activePlan.slug}`
                        : `/plan/custom?edit=${activePlan.slug}`
                    }
                    className="text-[10px] text-muted hover:text-accent transition-colors"
                  >
                    {activePlan.builtIn ? "Customize" : "Edit"}
                  </Link>
                </div>
              </div>
              <h2 className="text-sm font-medium mt-2">{activePlan.name}</h2>
              <p className="text-muted text-xs mt-1">{activePlan.description}</p>
              {activePlan.fit && (
                <p className="text-xs text-foreground/70 mt-1">{activePlan.fit}</p>
              )}
            </div>

            {/* Day-by-day exercises */}
            <div className="px-4 pb-4 space-y-4">
              {days.map((day) => {
                const shortLabel = day.label.includes("—")
                  ? day.label.split("—")[1].trim()
                  : day.label;
                return (
                  <div key={day.label}>
                    <div className="text-xs font-medium text-muted mb-2">
                      {shortLabel}
                    </div>
                    <div className="space-y-1">
                      {day.exercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <span className="text-foreground/90">{ex.name}</span>
                          <span className="text-muted tabular-nums">
                            {ex.sets} x {ex.repRange[0]}–{ex.repRange[1]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Extras inline with current plan */}
              {selectedExtras.length > 0 && (
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted">Session Extras</span>
                    <Link href="/plan/extras" className="text-[10px] text-muted hover:text-accent">Edit</Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedExtras.map((ext) => (
                      <span
                        key={ext.id}
                        className="text-[10px] text-accent border border-accent/40 bg-accent/10 rounded-full px-2 py-0.5"
                      >
                        {ext.name} · {ext.duration}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedExtras.length === 0 && (
                <Link
                  href="/plan/extras"
                  className="block border-t border-border pt-3 text-muted text-xs hover:text-accent transition-colors"
                >
                  + Add session extras (abs, cardio, stretch)
                </Link>
              )}

              {/* ── Customize Warmups + Extras Vibes ── */}
              <div className="border-t border-border pt-3 mt-1">
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowWarmupPrefs(!showWarmupPrefs); setShowExtrasVibes(false); }}
                    className={`flex-1 text-xs py-2 border rounded-md transition-colors ${
                      showWarmupPrefs ? "border-accent text-accent bg-accent/5" : "border-border text-muted hover:border-muted"
                    }`}
                  >
                    Customize Warmups
                  </button>
                  <button
                    onClick={() => { setShowExtrasVibes(!showExtrasVibes); setShowWarmupPrefs(false); }}
                    className={`flex-1 text-xs py-2 border rounded-md transition-colors ${
                      showExtrasVibes ? "border-accent text-accent bg-accent/5" : "border-border text-muted hover:border-muted"
                    }`}
                  >
                    Extras Vibes
                  </button>
                </div>

                {showWarmupPrefs && (() => {
                  const globalOff = typeof window !== "undefined" && localStorage.getItem("gym-disable-warmups") === "true";
                  return (
                    <div className="mt-3 space-y-3">
                      {globalOff && (
                        <p className="text-[11px] text-muted border border-border rounded p-2 leading-relaxed">
                          Warmups are globally disabled in Settings → Workout. Per-exercise settings apply when re-enabled.
                        </p>
                      )}
                      {days.map((day) => {
                        const shortLabel = day.label.includes("—") ? day.label.split("—")[1].trim() : day.label;
                        return (
                          <div key={day.label}>
                            <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-1.5">{shortLabel}</p>
                            <div className="space-y-0.5">
                              {day.exercises.map((ex) => {
                                const enabled = warmupPrefs[ex.id] !== false;
                                return (
                                  <div key={ex.id} className="flex items-center justify-between py-1.5">
                                    <span className="text-xs text-text">{ex.name}</span>
                                    <button
                                      onClick={() => toggleWarmupPref(ex.id)}
                                      aria-label={enabled ? "Disable warmup" : "Enable warmup"}
                                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                                        enabled && !globalOff
                                          ? "border-accent bg-accent"
                                          : "border-border bg-transparent"
                                      }`}
                                    >
                                      {enabled && !globalOff && (
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--color-bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M2 5l2 2 4-4" />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {showExtrasVibes && (
                  <div className="mt-3 space-y-4">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-2">Category nudge</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {(["none", "abs", "cardio", "stretch"] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => updateVibes({ categoryBias: cat })}
                            className={`text-xs px-3 py-1.5 border rounded-full transition-colors ${
                              extrasVibes.categoryBias === cat
                                ? "border-accent text-accent bg-accent/5"
                                : "border-border text-muted hover:border-muted"
                            }`}
                          >
                            {cat === "none" ? "No bias" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-2">Duration preference</p>
                      <div className="flex gap-1.5">
                        {(["any", "quick", "longer"] as const).map((dur) => (
                          <button
                            key={dur}
                            onClick={() => updateVibes({ duration: dur })}
                            className={`text-xs px-3 py-1.5 border rounded-full transition-colors ${
                              extrasVibes.duration === dur
                                ? "border-accent text-accent bg-accent/5"
                                : "border-border text-muted hover:border-muted"
                            }`}
                          >
                            {dur.charAt(0).toUpperCase() + dur.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted leading-relaxed">
                      Nudges the post-session suggestion engine toward your preferences.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── All Plans ── */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-1">All Plans</h2>
        <p className="text-xs text-muted mb-3">You can change your plan at any time. Changing a plan will not affect your existing training session history.</p>

        {/* Category Tabs */}
        <div className="flex gap-1 border border-border rounded-lg p-1 mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setExpandedSlug(null); }}
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

        {/* Loading */}
        {!dbPlans && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-surface rounded animate-pulse" />
            ))}
          </div>
        )}

        {/* Plans grouped by goal */}
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
                <div className="space-y-3">{renderPlans(plans)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Custom plans */}
        {dbPlans && tab === "custom" && (
          <div className="space-y-3">
            {customPlans.length === 0 && (
              <p className="text-muted text-xs text-center py-4">
                No custom plans yet. Create one below!
              </p>
            )}
            {renderPlans(customPlans)}
          </div>
        )}

        <Link
          href="/plan/custom"
          className="flex items-center justify-center w-full h-10 mt-4 border border-dashed border-border rounded text-sm text-muted hover:border-muted hover:text-accent transition-colors"
        >
          + Create custom plan
        </Link>
      </div>

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
