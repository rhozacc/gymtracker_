"use client";

import { useState, useEffect } from "react";
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

type Step = "welcome" | "theme" | "unit" | "plan" | "extras" | "done";
const STEPS: Step[] = ["welcome", "theme", "unit", "plan", "extras", "done"];

export function useOnboarded() {
  const { data, isLoading, mutate } = useSWR<Preferences>("/api/preferences", fetcher);
  return {
    onboarded: data?.onboarded ?? true, // default true to avoid flash
    checked: !isLoading,
    mutate,
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

// Group plans by goal for display
const plansByGoal = (plans: PlanDefinition[], category: "men" | "women") => {
  const filtered = plans.filter((p) => p.category === category);
  const groups: Record<string, PlanDefinition[]> = {};
  for (const p of filtered) {
    const g = p.goal || "other";
    if (!groups[g]) groups[g] = [];
    groups[g].push(p);
  }
  return groups;
};

const GOAL_LABELS: Record<string, string> = {
  bulk: "Bulk",
  balanced: "Balanced",
  lean: "Lean",
  other: "Other",
};

export function Welcome({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>("welcome");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "dark";
  });
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [selectedPlan, setSelectedPlan] = useState("upper_lower");
  const [planTab, setPlanTab] = useState<"men" | "women">("men");
  const [extras, setExtras] = useState<ExtrasSelection>({ abs: null, cardio: null, stretch: null });
  const [fade, setFade] = useState(false);

  const allPlans = Object.values(PLANS);

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
    }, 300);
  }

  async function finish() {
    setFade(true);
    // Save everything to DB
    await Promise.all([
      savePrefs({ onboarded: true, activePlan: selectedPlan, theme, unit }),
      saveExtras(extras),
    ]);
    localStorage.setItem("gym-active-plan", selectedPlan);
    setTimeout(() => onDone(), 400);
  }

  const totalSteps = STEPS.length - 2; // exclude welcome and done from count

  return (
    <div className="fixed inset-0 z-[300] bg-bg flex items-center justify-center overflow-hidden">
      {/* Animated accent glow */}
      <div
        className="absolute w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{
          background: "var(--color-accent)",
          animation: "welcome-pulse 4s ease-in-out infinite",
        }}
      />

      <div
        className={`relative z-10 max-w-sm w-full px-6 transition-all duration-300 ${
          fade ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        {/* Step: Welcome */}
        {step === "welcome" && (
          <div className="text-center">
            <div className="mb-8" style={{ animation: "welcome-icon-in 0.6s ease-out" }}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto"
              >
                <path d="M6.5 6.5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0Z" />
                <path d="M1.5 20.4a6.5 6.5 0 0 1 13 0" />
                <path d="M16 15l2 2 4-4" />
              </svg>
            </div>
            <h1
              className="text-2xl font-semibold text-text mb-2"
              style={{ animation: "welcome-text-in 0.6s ease-out 0.1s both" }}
            >
              Gym Tracker
            </h1>
            <p
              className="text-muted text-sm mb-10"
              style={{ animation: "welcome-text-in 0.6s ease-out 0.2s both" }}
            >
              Track sessions. Progressive overload. Stay consistent.
            </p>
            <button
              onClick={() => next("theme")}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
              style={{ animation: "welcome-text-in 0.6s ease-out 0.3s both" }}
            >
              Get started
            </button>
          </div>
        )}

        {/* Step: Theme */}
        {step === "theme" && (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">
              Step 1 of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2">Pick your vibe</h2>
            <p className="text-muted text-xs mb-8">You can change this later</p>
            <div className="flex gap-3 mb-10">
              <button
                onClick={() => applyTheme("dark")}
                className={`flex-1 aspect-[3/4] rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  theme === "dark"
                    ? "border-accent bg-accent/5 scale-[1.02]"
                    : "border-border hover:border-muted"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-[#222] flex items-center justify-center">
                  <span className="text-[#39ff14] text-lg">{"\u25CF"}</span>
                </div>
                <span className={`text-xs font-medium ${theme === "dark" ? "text-accent" : "text-muted"}`}>
                  Dark
                </span>
              </button>
              <button
                onClick={() => applyTheme("light")}
                className={`flex-1 aspect-[3/4] rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  theme === "light"
                    ? "border-accent bg-accent/5 scale-[1.02]"
                    : "border-border hover:border-muted"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#f5f5f5] border border-[#e0e0e0] flex items-center justify-center">
                  <span className="text-[#d4622b] text-lg">{"\u25CF"}</span>
                </div>
                <span className={`text-xs font-medium ${theme === "light" ? "text-accent" : "text-muted"}`}>
                  Light
                </span>
              </button>
            </div>
            <button
              onClick={() => next("unit")}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step: Unit */}
        {step === "unit" && (
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">
              Step 2 of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2">Weight unit</h2>
            <p className="text-muted text-xs mb-8">All data stored in kg, display converts</p>
            <div className="flex gap-3 mb-10">
              <button
                onClick={() => applyUnit("kg")}
                className={`flex-1 h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                  unit === "kg"
                    ? "border-accent bg-accent/5 scale-[1.02]"
                    : "border-border hover:border-muted"
                }`}
              >
                <span className={`text-2xl font-bold ${unit === "kg" ? "text-accent" : "text-text"}`}>KG</span>
                <span className="text-[10px] text-muted">Kilograms</span>
              </button>
              <button
                onClick={() => applyUnit("lbs")}
                className={`flex-1 h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                  unit === "lbs"
                    ? "border-accent bg-accent/5 scale-[1.02]"
                    : "border-border hover:border-muted"
                }`}
              >
                <span className={`text-2xl font-bold ${unit === "lbs" ? "text-accent" : "text-text"}`}>LBS</span>
                <span className="text-[10px] text-muted">Pounds</span>
              </button>
            </div>
            <button
              onClick={() => next("plan")}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step: Plan selection */}
        {step === "plan" && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6 text-center">
              Step 3 of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2 text-center">Choose a plan</h2>
            <p className="text-muted text-xs mb-4 text-center">You can change or create custom plans later</p>

            {/* Category tabs */}
            <div className="flex gap-1 border border-border rounded-lg p-1 mb-4">
              {(["men", "women"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPlanTab(cat)}
                  className={`flex-1 text-xs py-2 rounded-md transition-colors ${
                    planTab === cat
                      ? "bg-surface text-accent font-medium"
                      : "text-muted hover:text-text"
                  }`}
                >
                  {cat === "men" ? "Men's" : "Women's"}
                </button>
              ))}
            </div>

            {/* Plan list */}
            <div className="max-h-[40vh] overflow-y-auto space-y-3 mb-6 -mx-1 px-1">
              {Object.entries(plansByGoal(allPlans, planTab)).map(([goal, plans]) => (
                <div key={goal}>
                  <div className="text-[10px] uppercase tracking-wide text-muted mb-2">
                    {GOAL_LABELS[goal] || goal}
                  </div>
                  {plans.map((p) => (
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
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={() => next("extras")}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step: Extras selection */}
        {step === "extras" && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6 text-center">
              Step 4 of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2 text-center">Session extras</h2>
            <p className="text-muted text-xs mb-4 text-center">
              Optional add-ons after each workout. Tap to select.
            </p>

            <div className="max-h-[45vh] overflow-y-auto space-y-4 mb-6 -mx-1 px-1">
              {(["abs", "cardio", "stretch"] as ExtraCategory[]).map((cat) => (
                <div key={cat}>
                  <div className="text-[10px] uppercase tracking-wide text-muted mb-2">
                    {CATEGORY_INFO[cat].label}
                  </div>
                  <div className="space-y-2">
                    {EXTRAS_BY_CATEGORY[cat].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => toggleExtra(cat, opt.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                          extras[cat] === opt.id
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
                </div>
              ))}
            </div>

            <button
              onClick={() => next("done")}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              {extras.abs || extras.cardio || extras.stretch ? "Continue" : "Skip for now"}
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="text-center">
            <div
              className="mb-6 text-accent"
              style={{ animation: "welcome-icon-in 0.5s ease-out" }}
            >
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            </div>
            <h2
              className="text-lg font-medium text-text mb-2"
              style={{ animation: "welcome-text-in 0.5s ease-out 0.1s both" }}
            >
              You&apos;re all set
            </h2>
            <p
              className="text-muted text-xs mb-8"
              style={{ animation: "welcome-text-in 0.5s ease-out 0.15s both" }}
            >
              Start your first session from the home screen.
            </p>
            <button
              onClick={finish}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
              style={{ animation: "welcome-text-in 0.5s ease-out 0.2s both" }}
            >
              Let&apos;s go
            </button>
          </div>
        )}
      </div>

      {/* Step dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
        {STEPS.map((s) => (
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
