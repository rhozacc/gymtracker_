"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { PLANS, type PlanDefinition } from "@/lib/program";
import {
  EXTRAS_BY_CATEGORY,
  CATEGORY_INFO,
  type ExtraCategory,
  type ExtrasSelection,
} from "@/lib/extras";

interface Preferences {
  onboarded: boolean;
  activePlan: string;
  theme: string;
  unit: string;
}

type Step = "welcome" | "theme" | "unit" | "gender" | "goal" | "plan" | "extras" | "done";
const STEPS: Step[] = ["welcome", "theme", "unit", "gender", "goal", "plan", "extras", "done"];
type Gender = "men" | "women";
type Goal = "bulk" | "balanced" | "lean";

const GOAL_INFO: Record<Goal, { label: string; desc: string }> = {
  bulk: { label: "Bulk", desc: "Build size & strength" },
  balanced: { label: "Balanced", desc: "Well-rounded training" },
  lean: { label: "Lean", desc: "Cut & define" },
};

export function useOnboarded() {
  const { data, isLoading } = useSWR<Preferences>("/api/preferences", fetcher);
  return {
    onboarded: data?.onboarded ?? true,
    checked: !isLoading,
  };
}

async function savePrefs(data: Partial<Preferences>) {
  await fetch("/api/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

async function saveExtras(selection: ExtrasSelection) {
  await fetch("/api/extras", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selection),
  });
}

function getRecommended(gender: Gender, goal: Goal): PlanDefinition[] {
  return Object.values(PLANS).filter(
    (p) => p.category === gender && p.goal === goal
  );
}

function getAllForGender(gender: Gender): PlanDefinition[] {
  return Object.values(PLANS).filter((p) => p.category === gender);
}

export function Welcome({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>("welcome");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark";
  });
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [gender, setGender] = useState<Gender>("men");
  const [goal, setGoal] = useState<Goal>("balanced");
  const [selectedPlan, setSelectedPlan] = useState("upper_lower");
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [extras, setExtras] = useState<ExtrasSelection>({ abs: null, cardio: null, stretch: null });
  const [extraTab, setExtraTab] = useState<ExtraCategory>("abs");
  const [fade, setFade] = useState(false);

  function applyTheme(t: "dark" | "light") {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("gym-theme", t);
  }

  function applyUnit(u: "kg" | "lbs") {
    setUnit(u);
    localStorage.setItem("gym-unit", u);
  }

  function toggleExtra(category: ExtraCategory, optionId: string) {
    setExtras((prev) => ({
      ...prev,
      [category]: prev[category] === optionId ? null : optionId,
    }));
  }

  function next(nextStep: Step) {
    setFade(true);
    setTimeout(() => {
      setStep(nextStep);
      setFade(false);
      setShowAllPlans(false);
    }, 300);
  }

  async function finish() {
    setFade(true);
    await Promise.all([
      savePrefs({ onboarded: true, activePlan: selectedPlan, theme, unit }),
      saveExtras(extras),
    ]);
    localStorage.setItem("gym-active-plan", selectedPlan);
    setTimeout(() => onDone(), 400);
  }

  const totalSteps = STEPS.length - 2;
  const stepNum = STEPS.indexOf(step); // 0=welcome, 7=done

  const recommended = getRecommended(gender, goal);
  const allPlans = getAllForGender(gender);

  function PlanCard({ p }: { p: PlanDefinition }) {
    return (
      <button
        key={p.id}
        onClick={() => setSelectedPlan(p.id)}
        className={`w-full text-left p-3 rounded-lg border-2 mb-2 transition-all duration-200 ${
          selectedPlan === p.id
            ? "border-accent bg-accent/5"
            : "border-border hover:border-muted"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{p.name}</span>
          <span className="text-[10px] text-muted">
            {Object.keys(p.days).length} days
          </span>
        </div>
        <p className="text-muted text-xs mt-1">{p.description}</p>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] bg-bg flex items-center justify-center overflow-hidden">
      <div
        className="absolute w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--color-accent)", animation: "welcome-pulse 4s ease-in-out infinite" }}
      />

      <div
        className={`relative z-10 max-w-sm w-full px-6 transition-all duration-300 ${
          fade ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        {/* Welcome */}
        {step === "welcome" && (
          <div className="text-center">
            <div className="mb-8" style={{ animation: "welcome-icon-in 0.6s ease-out" }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                <path d="M6.5 6.5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0Z" />
                <path d="M1.5 20.4a6.5 6.5 0 0 1 13 0" />
                <path d="M16 15l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-text mb-2" style={{ animation: "welcome-text-in 0.6s ease-out 0.1s both" }}>
              Gym Tracker
            </h1>
            <p className="text-muted text-sm mb-10" style={{ animation: "welcome-text-in 0.6s ease-out 0.2s both" }}>
              Track sessions. Progressive overload. Stay consistent.
            </p>
            <button onClick={() => next("theme")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity" style={{ animation: "welcome-text-in 0.6s ease-out 0.3s both" }}>
              Get started
            </button>
          </div>
        )}

        {/* Theme */}
        {step === "theme" && (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">Step 1 of {totalSteps}</p>
            <h2 className="text-lg font-medium text-text mb-2">Pick your vibe</h2>
            <p className="text-muted text-xs mb-8">You can change this later</p>
            <div className="flex gap-3 mb-10">
              <button onClick={() => applyTheme("dark")} className={`flex-1 aspect-[3/4] rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 ${theme === "dark" ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-muted"}`}>
                <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-[#222] flex items-center justify-center">
                  <span className="text-[#39ff14] text-lg">{"\u25CF"}</span>
                </div>
                <span className={`text-xs font-medium ${theme === "dark" ? "text-accent" : "text-muted"}`}>Dark</span>
              </button>
              <button onClick={() => applyTheme("light")} className={`flex-1 aspect-[3/4] rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 ${theme === "light" ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-muted"}`}>
                <div className="w-10 h-10 rounded-full bg-[#f5f5f5] border border-[#e0e0e0] flex items-center justify-center">
                  <span className="text-[#d4622b] text-lg">{"\u25CF"}</span>
                </div>
                <span className={`text-xs font-medium ${theme === "light" ? "text-accent" : "text-muted"}`}>Light</span>
              </button>
            </div>
            <button onClick={() => next("unit")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">Continue</button>
          </div>
        )}

        {/* Unit */}
        {step === "unit" && (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">Step 2 of {totalSteps}</p>
            <h2 className="text-lg font-medium text-text mb-2">Weight unit</h2>
            <p className="text-muted text-xs mb-8">All data stored in kg, display converts</p>
            <div className="flex gap-3 mb-10">
              <button onClick={() => applyUnit("kg")} className={`flex-1 h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${unit === "kg" ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-muted"}`}>
                <span className={`text-2xl font-bold ${unit === "kg" ? "text-accent" : "text-text"}`}>KG</span>
                <span className="text-[10px] text-muted">Kilograms</span>
              </button>
              <button onClick={() => applyUnit("lbs")} className={`flex-1 h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${unit === "lbs" ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-muted"}`}>
                <span className={`text-2xl font-bold ${unit === "lbs" ? "text-accent" : "text-text"}`}>LBS</span>
                <span className="text-[10px] text-muted">Pounds</span>
              </button>
            </div>
            <button onClick={() => next("gender")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">Continue</button>
          </div>
        )}

        {/* Gender */}
        {step === "gender" && (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">Step 3 of {totalSteps}</p>
            <h2 className="text-lg font-medium text-text mb-2">Training style</h2>
            <p className="text-muted text-xs mb-8">This determines which plans we recommend</p>
            <div className="flex gap-3 mb-10">
              <button onClick={() => setGender("men")} className={`flex-1 h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${gender === "men" ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-muted"}`}>
                <span className={`text-2xl ${gender === "men" ? "text-accent" : "text-text"}`}>M</span>
                <span className="text-[10px] text-muted">Men&apos;s</span>
              </button>
              <button onClick={() => setGender("women")} className={`flex-1 h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${gender === "women" ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-muted"}`}>
                <span className={`text-2xl ${gender === "women" ? "text-accent" : "text-text"}`}>F</span>
                <span className="text-[10px] text-muted">Women&apos;s</span>
              </button>
            </div>
            <button onClick={() => next("goal")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">Continue</button>
          </div>
        )}

        {/* Goal */}
        {step === "goal" && (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">Step 4 of {totalSteps}</p>
            <h2 className="text-lg font-medium text-text mb-2">What&apos;s your goal?</h2>
            <p className="text-muted text-xs mb-6">We&apos;ll recommend plans that match</p>
            <div className="space-y-3 mb-10">
              {(["bulk", "balanced", "lean"] as Goal[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`w-full h-16 rounded-xl border-2 transition-all duration-200 flex items-center px-5 gap-4 ${
                    goal === g ? "border-accent bg-accent/5" : "border-border hover:border-muted"
                  }`}
                >
                  <span className={`text-lg font-bold ${goal === g ? "text-accent" : "text-text"}`}>
                    {GOAL_INFO[g].label}
                  </span>
                  <span className="text-xs text-muted">{GOAL_INFO[g].desc}</span>
                </button>
              ))}
            </div>
            <button onClick={() => next("plan")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">Continue</button>
          </div>
        )}

        {/* Plan — recommended first, then "see all" */}
        {step === "plan" && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6 text-center">Step 5 of {totalSteps}</p>
            <h2 className="text-lg font-medium text-text mb-2 text-center">Pick a plan</h2>
            <p className="text-muted text-xs mb-4 text-center">
              Recommended for {GOAL_INFO[goal].label.toLowerCase()}
            </p>

            <div className="max-h-[45vh] overflow-y-auto space-y-1 mb-4 -mx-1 px-1">
              {recommended.map((p) => (
                <PlanCard key={p.id} p={p} />
              ))}

              {!showAllPlans && allPlans.length > recommended.length && (
                <button
                  onClick={() => setShowAllPlans(true)}
                  className="w-full text-center py-3 text-xs text-muted hover:text-accent transition-colors"
                >
                  See all {gender === "men" ? "men's" : "women's"} plans ({allPlans.length})
                </button>
              )}

              {showAllPlans && (
                <>
                  <div className="text-[10px] uppercase tracking-wide text-muted mt-4 mb-2">All plans</div>
                  {allPlans
                    .filter((p) => !recommended.some((r) => r.id === p.id))
                    .map((p) => (
                      <PlanCard key={p.id} p={p} />
                    ))}
                </>
              )}
            </div>

            <button onClick={() => next("extras")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">Continue</button>
          </div>
        )}

        {/* Extras — tabbed by category */}
        {step === "extras" && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6 text-center">Step 6 of {totalSteps}</p>
            <h2 className="text-lg font-medium text-text mb-2 text-center">Session extras</h2>
            <p className="text-muted text-xs mb-4 text-center">Optional add-ons after each workout</p>

            {/* Category tabs */}
            <div className="flex gap-1 border border-border rounded-lg p-1 mb-4">
              {(["abs", "cardio", "stretch"] as ExtraCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setExtraTab(cat)}
                  className={`flex-1 text-xs py-2 rounded-md transition-colors ${
                    extraTab === cat
                      ? "bg-surface text-accent font-medium"
                      : "text-muted hover:text-text"
                  }`}
                >
                  {CATEGORY_INFO[cat].label}
                  {extras[cat] && <span className="ml-1 text-accent">*</span>}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-muted mb-3">{CATEGORY_INFO[extraTab].description}</p>

            <div className="space-y-2 mb-6">
              {EXTRAS_BY_CATEGORY[extraTab].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleExtra(extraTab, opt.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                    extras[extraTab] === opt.id
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{opt.name}</span>
                    <span className="text-[10px] text-muted">{opt.duration}</span>
                  </div>
                  <p className="text-muted text-xs mt-1">{opt.description}</p>
                </button>
              ))}
            </div>

            <button onClick={() => next("done")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">
              {extras.abs || extras.cardio || extras.stretch ? "Continue" : "Skip for now"}
            </button>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="text-center">
            <div className="mb-6 text-accent" style={{ animation: "welcome-icon-in 0.5s ease-out" }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-text mb-2" style={{ animation: "welcome-text-in 0.5s ease-out 0.1s both" }}>You&apos;re all set</h2>
            <p className="text-muted text-xs mb-8" style={{ animation: "welcome-text-in 0.5s ease-out 0.15s both" }}>Start your first session from the home screen.</p>
            <button onClick={finish} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity" style={{ animation: "welcome-text-in 0.5s ease-out 0.2s both" }}>
              Let&apos;s go
            </button>
          </div>
        )}
      </div>

      {/* Step dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              s === step ? "bg-accent w-4" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
