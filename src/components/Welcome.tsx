"use client";

import { useState, useEffect, useCallback } from "react";
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

type Step =
  | "welcome"
  | "about"
  | "theme"
  | "unit"
  | "gender"
  | "goal"
  | "plan"
  | "extras"
  | "saving"
  | "nav"
  | "pwa"
  | "notifications"
  | "ready";

const STEPS: Step[] = [
  "welcome",
  "about",
  "theme",
  "unit",
  "gender",
  "goal",
  "plan",
  "extras",
  "saving",
  "nav",
  "pwa",
  "notifications",
  "ready",
];

type Gender = "men" | "women";
type Goal = "bulk" | "balanced" | "lean";

const GOAL_INFO: Record<Goal, { label: string; desc: string }> = {
  bulk: { label: "Bulk", desc: "Build size & strength" },
  balanced: { label: "Balanced", desc: "Well-rounded training" },
  lean: { label: "Lean", desc: "Cut & define" },
};

const EXTRA_CATEGORIES: ExtraCategory[] = ["abs", "cardio", "stretch"];

export function useOnboarded() {
  const { data, isLoading } = useSWR<Preferences>("/api/preferences", fetcher);

  // Check localStorage as fast cache before SWR resolves
  let localOnboarded = false;
  if (typeof window !== "undefined") {
    localOnboarded = localStorage.getItem("gym-onboarded") === "true";
  }

  return {
    onboarded: localOnboarded || (data?.onboarded ?? false),
    checked: localOnboarded || !isLoading,
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

// ─── DB Plan types ──────────────────────────────────────────────────
interface DbPlanRaw {
  slug: string;
  name: string;
  description: string;
  builtIn: boolean;
  days: Record<string, { label: string; exercises: { id: string }[] }>;
}

interface EnrichedPlan {
  id: string;
  name: string;
  description: string;
  category: string;
  goal: string;
  dayCount: number;
}

function enrichDbPlans(raw: DbPlanRaw[]): EnrichedPlan[] {
  return raw
    .filter((p) => p.builtIn)
    .map((p) => {
      const builtIn = PLANS[p.slug];
      return {
        id: p.slug,
        name: builtIn?.name || p.name,
        description: builtIn?.description || p.description,
        category: builtIn?.category || "",
        goal: builtIn?.goal || "",
        dayCount: Object.keys(p.days).length,
      };
    });
}

function getRecommendedDb(plans: EnrichedPlan[], gender: Gender, goal: Goal) {
  return plans.filter((p) => p.category === gender && p.goal === goal);
}

function getAllForGenderDb(plans: EnrichedPlan[], gender: Gender) {
  return plans.filter((p) => p.category === gender);
}

// Fallback to built-in PLANS if DB fetch fails
function getRecommendedFallback(gender: Gender, goal: Goal): EnrichedPlan[] {
  return Object.values(PLANS)
    .filter((p) => p.category === gender && p.goal === goal)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      goal: p.goal,
      dayCount: Object.keys(p.days).length,
    }));
}

function getAllForGenderFallback(gender: Gender): EnrichedPlan[] {
  return Object.values(PLANS)
    .filter((p) => p.category === gender)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      goal: p.goal,
      dayCount: Object.keys(p.days).length,
    }));
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

// ─── Main component ─────────────────────────────────────────────────

export function Welcome({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>("welcome");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (
      (document.documentElement.getAttribute("data-theme") as
        | "dark"
        | "light") || "dark"
    );
  });
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [gender, setGender] = useState<Gender>("men");
  const [goal, setGoal] = useState<Goal>("balanced");
  const [selectedPlan, setSelectedPlan] = useState("upper_lower");
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [extras, setExtras] = useState<ExtrasSelection>({
    abs: null,
    cardio: null,
    stretch: null,
  });
  const [extraCategory, setExtraCategory] = useState<ExtraCategory>("abs");
  const [fade, setFade] = useState(false);
  const [savingState, setSavingState] = useState<"saving" | "done" | null>(
    null
  );
  const [notifResult, setNotifResult] = useState<
    "granted" | "denied" | "default" | null
  >(null);

  // Fetch plans from DB
  const { data: rawPlans } = useSWR<DbPlanRaw[]>("/api/plans", fetcher);
  const dbPlans = rawPlans ? enrichDbPlans(rawPlans) : null;

  const recommended = dbPlans
    ? getRecommendedDb(dbPlans, gender, goal)
    : getRecommendedFallback(gender, goal);
  const allPlans = dbPlans
    ? getAllForGenderDb(dbPlans, gender)
    : getAllForGenderFallback(gender);

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
    // Auto-advance to next category after selection
    setTimeout(() => advanceExtraCategory(), 500);
  }

  function skipExtraCategory() {
    setExtras((prev) => ({ ...prev, [extraCategory]: null }));
    advanceExtraCategory();
  }

  function advanceExtraCategory() {
    const idx = EXTRA_CATEGORIES.indexOf(extraCategory);
    if (idx < EXTRA_CATEGORIES.length - 1) {
      setExtraCategory(EXTRA_CATEGORIES[idx + 1]);
    } else {
      next("saving");
    }
  }

  function next(nextStep: Step) {
    setFade(true);
    setTimeout(() => {
      setStep(nextStep);
      setFade(false);
      setShowAllPlans(false);
    }, 300);
  }

  function goBack() {
    // Special: if in extras and not on first category, go back a category
    if (step === "extras") {
      const idx = EXTRA_CATEGORIES.indexOf(extraCategory);
      if (idx > 0) {
        setExtraCategory(EXTRA_CATEGORIES[idx - 1]);
        return;
      }
    }
    const idx = STEPS.indexOf(step);
    if (idx > 0) {
      next(STEPS[idx - 1]);
    }
  }

  // Saving step: save to DB then auto-advance
  useEffect(() => {
    if (step !== "saving") return;
    setSavingState("saving");
    Promise.all([
      savePrefs({ onboarded: true, activePlan: selectedPlan, theme, unit }),
      saveExtras(extras),
    ]).then(() => {
      localStorage.setItem("gym-onboarded", "true");
      localStorage.setItem("gym-active-plan", selectedPlan);
      setSavingState("done");
      setTimeout(() => next("nav"), 1200);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Ready step: auto-dismiss after delay
  useEffect(() => {
    if (step !== "ready") return;
    const t = setTimeout(() => {
      setFade(true);
      setTimeout(() => onDone(), 400);
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function requestNotifications() {
    if (!("Notification" in window)) {
      setNotifResult("denied");
      return;
    }
    const result = await Notification.requestPermission();
    setNotifResult(result);
  }

  // Step numbering (exclude welcome, saving, ready from count)
  const numberedSteps: Step[] = [
    "about",
    "theme",
    "unit",
    "gender",
    "goal",
    "plan",
    "extras",
    "nav",
    "pwa",
    "notifications",
  ];
  const stepNum = numberedSteps.indexOf(step) + 1;
  const totalSteps = numberedSteps.length;

  function PlanCard({ p }: { p: EnrichedPlan }) {
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
          <span className="text-[10px] text-muted">{p.dayCount} days</span>
        </div>
        <p className="text-muted text-xs mt-1">{p.description}</p>
      </button>
    );
  }

  // ─── Back button ─────────────────────────────────────────────────
  const BackButton = () => {
    if (step === "welcome" || step === "saving" || step === "ready")
      return null;
    return (
      <button
        onClick={goBack}
        className="absolute top-0 left-0 text-muted text-sm hover:text-accent transition-colors flex items-center gap-1"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[300] bg-bg flex items-center justify-center overflow-hidden">
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
        <BackButton />

        {/* ── Welcome ── */}
        {step === "welcome" && (
          <div className="text-center">
            <div
              className="mb-8"
              style={{ animation: "welcome-icon-in 0.6s ease-out" }}
            >
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
              style={{
                animation: "welcome-text-in 0.6s ease-out 0.1s both",
              }}
            >
              gymtracker_
            </h1>
            <p
              className="text-muted text-sm mb-10"
              style={{
                animation: "welcome-text-in 0.6s ease-out 0.2s both",
              }}
            >
              Track sessions. Progressive overload. Stay consistent.
            </p>
            <button
              onClick={() => next("about")}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
              style={{
                animation: "welcome-text-in 0.6s ease-out 0.3s both",
              }}
            >
              Get started
            </button>
          </div>
        )}

        {/* ── About ── */}
        {step === "about" && (
          <div className="text-center pt-8">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2">
              What is gymtracker_?
            </h2>
            <p className="text-muted text-xs mb-8">
              Your personal gym companion
            </p>
            <div className="space-y-4 text-left mb-10">
              <div className="flex items-start gap-3">
                <span className="text-accent text-sm mt-0.5">01</span>
                <div>
                  <p className="text-sm font-medium">Track every session</p>
                  <p className="text-muted text-xs">
                    Log weight, reps, and RIR for each set
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent text-sm mt-0.5">02</span>
                <div>
                  <p className="text-sm font-medium">Progressive overload</p>
                  <p className="text-muted text-xs">
                    Smart feedback tells you when to add weight
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent text-sm mt-0.5">03</span>
                <div>
                  <p className="text-sm font-medium">Guided sessions</p>
                  <p className="text-muted text-xs">
                    Step-by-step workouts with rest timers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent text-sm mt-0.5">04</span>
                <div>
                  <p className="text-sm font-medium">Track your trends</p>
                  <p className="text-muted text-xs">
                    Charts, strength progression, and muscle balance
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => next("theme")}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Theme ── */}
        {step === "theme" && (
          <div className="text-center pt-8">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2">
              Pick your vibe
            </h2>
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
                <span
                  className={`text-xs font-medium ${
                    theme === "dark" ? "text-accent" : "text-muted"
                  }`}
                >
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
                <span
                  className={`text-xs font-medium ${
                    theme === "light" ? "text-accent" : "text-muted"
                  }`}
                >
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

        {/* ── Unit ── */}
        {step === "unit" && (
          <div className="text-center pt-8">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2">Weight unit</h2>
            <p className="text-muted text-xs mb-8">
              All data stored in kg, display converts
            </p>
            <div className="flex gap-3 mb-10">
              <button
                onClick={() => applyUnit("kg")}
                className={`flex-1 h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                  unit === "kg"
                    ? "border-accent bg-accent/5 scale-[1.02]"
                    : "border-border hover:border-muted"
                }`}
              >
                <span
                  className={`text-2xl font-bold ${
                    unit === "kg" ? "text-accent" : "text-text"
                  }`}
                >
                  KG
                </span>
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
                <span
                  className={`text-2xl font-bold ${
                    unit === "lbs" ? "text-accent" : "text-text"
                  }`}
                >
                  LBS
                </span>
                <span className="text-[10px] text-muted">Pounds</span>
              </button>
            </div>
            <button
              onClick={() => next("gender")}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Gender ── */}
        {step === "gender" && (
          <div className="text-center pt-8">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2">
              Training style
            </h2>
            <p className="text-muted text-xs mb-8">
              This determines which plans we recommend
            </p>
            <div className="flex gap-3 mb-10">
              <button
                onClick={() => setGender("men")}
                className={`flex-1 h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                  gender === "men"
                    ? "border-accent bg-accent/5 scale-[1.02]"
                    : "border-border hover:border-muted"
                }`}
              >
                <span
                  className={`text-2xl ${
                    gender === "men" ? "text-accent" : "text-text"
                  }`}
                >
                  M
                </span>
                <span className="text-[10px] text-muted">Men&apos;s</span>
              </button>
              <button
                onClick={() => setGender("women")}
                className={`flex-1 h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                  gender === "women"
                    ? "border-accent bg-accent/5 scale-[1.02]"
                    : "border-border hover:border-muted"
                }`}
              >
                <span
                  className={`text-2xl ${
                    gender === "women" ? "text-accent" : "text-text"
                  }`}
                >
                  F
                </span>
                <span className="text-[10px] text-muted">Women&apos;s</span>
              </button>
            </div>
            <button
              onClick={() => next("goal")}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Goal ── */}
        {step === "goal" && (
          <div className="text-center pt-8">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2">
              What&apos;s your goal?
            </h2>
            <p className="text-muted text-xs mb-6">
              We&apos;ll recommend plans that match
            </p>
            <div className="space-y-3 mb-10">
              {(["bulk", "balanced", "lean"] as Goal[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`w-full h-16 rounded-xl border-2 transition-all duration-200 flex items-center px-5 gap-4 ${
                    goal === g
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-muted"
                  }`}
                >
                  <span
                    className={`text-lg font-bold ${
                      goal === g ? "text-accent" : "text-text"
                    }`}
                  >
                    {GOAL_INFO[g].label}
                  </span>
                  <span className="text-xs text-muted">
                    {GOAL_INFO[g].desc}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => next("plan")}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Plan (from DB) ── */}
        {step === "plan" && (
          <div className="pt-8">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6 text-center">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2 text-center">
              Pick a plan
            </h2>
            <p className="text-muted text-xs mb-4 text-center">
              Recommended for {GOAL_INFO[goal].label.toLowerCase()}
            </p>

            <div className="max-h-[45vh] overflow-y-auto space-y-1 mb-4 -mx-1 px-1">
              {recommended.length > 0 ? (
                recommended.map((p) => <PlanCard key={p.id} p={p} />)
              ) : (
                <div className="h-16 bg-surface rounded animate-pulse" />
              )}

              {!showAllPlans && allPlans.length > recommended.length && (
                <button
                  onClick={() => setShowAllPlans(true)}
                  className="w-full text-center py-3 text-xs text-muted hover:text-accent transition-colors"
                >
                  See all {gender === "men" ? "men's" : "women's"} plans (
                  {allPlans.length})
                </button>
              )}

              {showAllPlans && (
                <>
                  <div className="text-[10px] uppercase tracking-wide text-muted mt-4 mb-2">
                    All plans
                  </div>
                  {allPlans
                    .filter((p) => !recommended.some((r) => r.id === p.id))
                    .map((p) => (
                      <PlanCard key={p.id} p={p} />
                    ))}
                </>
              )}
            </div>

            <button
              onClick={() => {
                setExtraCategory("abs");
                next("extras");
              }}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Extras (sequential category flow) ── */}
        {step === "extras" && (
          <div className="pt-8">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6 text-center">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2 text-center">
              {CATEGORY_INFO[extraCategory].label}
            </h2>
            <p className="text-muted text-xs mb-4 text-center">
              {CATEGORY_INFO[extraCategory].description}
            </p>

            {/* Category progress */}
            <div className="flex gap-2 justify-center mb-6">
              {EXTRA_CATEGORIES.map((cat) => (
                <div
                  key={cat}
                  className={`h-1 w-8 rounded-full transition-colors ${
                    cat === extraCategory
                      ? "bg-accent"
                      : EXTRA_CATEGORIES.indexOf(cat) <
                        EXTRA_CATEGORIES.indexOf(extraCategory)
                      ? "bg-accent/40"
                      : "bg-border"
                  }`}
                />
              ))}
            </div>

            <div className="space-y-2 mb-4">
              {EXTRAS_BY_CATEGORY[extraCategory].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleExtra(extraCategory, opt.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                    extras[extraCategory] === opt.id
                      ? "border-accent bg-accent text-bg"
                      : "border-border hover:border-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        extras[extraCategory] === opt.id ? "text-bg" : ""
                      }`}
                    >
                      {opt.name}
                    </span>
                    <span
                      className={`text-[10px] ${
                        extras[extraCategory] === opt.id
                          ? "text-bg/70"
                          : "text-muted"
                      }`}
                    >
                      {opt.duration}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      extras[extraCategory] === opt.id
                        ? "text-bg/70"
                        : "text-muted"
                    }`}
                  >
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={skipExtraCategory}
              className="w-full h-12 border-2 border-border text-muted font-medium rounded-lg text-sm hover:border-muted hover:text-text transition-colors"
            >
              Not right now
            </button>
          </div>
        )}

        {/* ── Saving ── */}
        {step === "saving" && (
          <div className="text-center">
            <div className="mb-6">
              {savingState === "done" ? (
                <div
                  className="text-accent"
                  style={{ animation: "welcome-icon-in 0.4s ease-out" }}
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
              ) : (
                <div className="mx-auto w-14 h-14 border-2 border-border border-t-accent rounded-full animate-spin" />
              )}
            </div>
            <h2 className="text-lg font-medium text-text mb-2">
              {savingState === "done" ? "Saved" : "Saving your plan"}
            </h2>
            <p className="text-muted text-xs">
              {savingState === "done"
                ? "Everything is set up"
                : "Setting up your training plan..."}
            </p>
          </div>
        )}

        {/* ── Nav tutorial ── */}
        {step === "nav" && (
          <div className="text-center pt-8">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2">Navigation</h2>
            <p className="text-muted text-xs mb-6">
              Swipe or tap to switch between tabs
            </p>
            <div className="space-y-3 mb-10">
              {[
                {
                  label: "Home",
                  desc: "Dashboard, next session, streaks",
                  letter: "H",
                },
                {
                  label: "Plan",
                  desc: "Your training plan and extras",
                  letter: "P",
                },
                {
                  label: "Log",
                  desc: "Session history and details",
                  letter: "L",
                },
                {
                  label: "Trends",
                  desc: "Charts, strength, volume tracking",
                  letter: "T",
                },
              ].map((tab) => (
                <div
                  key={tab.label}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border"
                >
                  <span className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-semibold shrink-0">
                    {tab.letter}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium">{tab.label}</p>
                    <p className="text-muted text-xs">{tab.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => next("pwa")}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── PWA ── */}
        {step === "pwa" && (
          <div className="text-center pt-8">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2">
              Install the app
            </h2>
            {isStandalone() ? (
              <>
                <div
                  className="text-accent mb-6"
                  style={{ animation: "welcome-icon-in 0.4s ease-out" }}
                >
                  <svg
                    width="48"
                    height="48"
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
                <p className="text-muted text-xs mb-10">
                  Already installed. You&apos;re good!
                </p>
              </>
            ) : (
              <>
                <p className="text-muted text-xs mb-6">
                  For the best experience, add gymtracker_ to your home screen
                </p>
                <div className="text-left space-y-3 mb-10 border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-accent text-sm font-medium">1.</span>
                    <p className="text-xs text-muted">
                      Tap the{" "}
                      <span className="text-text font-medium">Share</span>{" "}
                      button in your browser
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent text-sm font-medium">2.</span>
                    <p className="text-xs text-muted">
                      Select{" "}
                      <span className="text-text font-medium">
                        Add to Home Screen
                      </span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent text-sm font-medium">3.</span>
                    <p className="text-xs text-muted">
                      Open gymtracker_ from your home screen
                    </p>
                  </div>
                </div>
              </>
            )}
            <button
              onClick={() => next("notifications")}
              className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Notifications ── */}
        {step === "notifications" && (
          <div className="text-center pt-8">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-6">
              Step {stepNum} of {totalSteps}
            </p>
            <h2 className="text-lg font-medium text-text mb-2">
              Notifications
            </h2>
            <p className="text-muted text-xs mb-8">
              Get notified when your rest timer ends, even with the screen
              locked
            </p>

            {notifResult === null ? (
              <div className="space-y-3">
                <button
                  onClick={requestNotifications}
                  className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
                >
                  Enable notifications
                </button>
                <button
                  onClick={() => next("ready")}
                  className="w-full h-12 border-2 border-border text-muted font-medium rounded-lg text-sm hover:border-muted hover:text-text transition-colors"
                >
                  Not now
                </button>
              </div>
            ) : (
              <div>
                <div
                  className={`mb-6 ${
                    notifResult === "granted" ? "text-accent" : "text-muted"
                  }`}
                  style={{ animation: "welcome-icon-in 0.4s ease-out" }}
                >
                  {notifResult === "granted" ? (
                    <svg
                      width="48"
                      height="48"
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
                  ) : (
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </div>
                <p className="text-muted text-xs mb-8">
                  {notifResult === "granted"
                    ? "Notifications enabled"
                    : "No worries — you can enable them later in settings"}
                </p>
                <button
                  onClick={() => next("ready")}
                  className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Ready ── */}
        {step === "ready" && (
          <div className="text-center">
            <div
              className="text-accent mb-6"
              style={{ animation: "welcome-icon-in 0.5s ease-out" }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <h2
              className="text-2xl font-semibold text-text mb-2"
              style={{
                animation: "welcome-text-in 0.5s ease-out 0.1s both",
              }}
            >
              Ready
            </h2>
            <p
              className="text-muted text-sm"
              style={{
                animation: "welcome-text-in 0.5s ease-out 0.15s both",
              }}
            >
              Let&apos;s get to work.
            </p>
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
