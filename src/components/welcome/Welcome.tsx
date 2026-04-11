"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import type { ExtraCategory, ExtrasSelection } from "@/lib/extras";
import {
  STEPS,
  NUMBERED_STEPS,
  type Step,
  type Gender,
  type Goal,
  type Preferences,
  type DbPlanRaw,
  type EnrichedPlan,
} from "./types";
import {
  enrichDbPlans,
  getRecommendedDb,
  getAllForGenderDb,
  getRecommendedFallback,
  getAllForGenderFallback,
  savePrefs,
  saveExtras,
} from "./utils";
import {
  WelcomeStep,
  AboutStep,
  ThemeStep,
  UnitStep,
  GenderStep,
  GoalStep,
  PlanStep,
  ExtrasStep,
  SavingStep,
  PwaStep,
  NotificationsStep,
  ReadyStep,
} from "./WelcomeSteps";

// ─── useOnboarded hook ───────────────────────────────────────────────

export function useOnboarded() {
  const { data, isLoading } = useSWR<Preferences>("/api/preferences", fetcher);

  let localOnboarded = false;
  if (typeof window !== "undefined") {
    localOnboarded = localStorage.getItem("gym-onboarded") === "true";
  }

  return {
    onboarded: localOnboarded || (data?.onboarded ?? false),
    checked: localOnboarded || !isLoading,
  };
}

// ─── Back button ─────────────────────────────────────────────────────

function BackButton({ step, onBack }: { step: Step; onBack: () => void }) {
  if (step === "welcome" || step === "saving" || step === "ready") return null;
  return (
    <button
      onClick={onBack}
      className="w-full mt-3 text-muted text-sm hover:text-accent transition-colors flex items-center justify-center gap-1"
    >
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}

// ─── Welcome component ───────────────────────────────────────────────

export function Welcome({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>("welcome");
  const [theme, setTheme] = useState<"dark" | "light" | "system">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("gym-theme");
    if (stored === "dark" || stored === "light" || stored === "system") return stored;
    return "dark";
  });
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [gender, setGender] = useState<Gender>("men");
  const [goal, setGoal] = useState<Goal>("balanced");
  const [selectedPlan, setSelectedPlan] = useState("upper_lower");
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [extras, setExtras] = useState<ExtrasSelection>({ abs: null, cardio: null, stretch: null });
  const [extraCategory, setExtraCategory] = useState<ExtraCategory>("abs");
  const [fade, setFade] = useState(false);
  const [savingState, setSavingState] = useState<"saving" | "done" | null>(null);
  const [notifResult, setNotifResult] = useState<"granted" | "denied" | "default" | null>(null);

  const { data: rawPlans } = useSWR<DbPlanRaw[]>("/api/plans", fetcher);
  const dbPlans = rawPlans ? enrichDbPlans(rawPlans) : null;

  const recommended: EnrichedPlan[] = dbPlans
    ? getRecommendedDb(dbPlans, gender, goal)
    : getRecommendedFallback(gender, goal);
  const allPlans: EnrichedPlan[] = dbPlans
    ? getAllForGenderDb(dbPlans, gender)
    : getAllForGenderFallback(gender);

  const stepNum = NUMBERED_STEPS.indexOf(step) + 1;
  const totalSteps = NUMBERED_STEPS.length;

  function applyTheme(t: "dark" | "light" | "system") {
    setTheme(t);
    localStorage.setItem("gym-theme", t);
    const resolved = t === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : t;
    document.documentElement.setAttribute("data-theme", resolved);
  }

  function applyUnit(u: "kg" | "lbs") {
    setUnit(u);
    localStorage.setItem("gym-unit", u);
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
    if (step === "extras") {
      const EXTRA_CATEGORIES = ["abs", "cardio", "stretch"] as const;
      const idx = EXTRA_CATEGORIES.indexOf(extraCategory as "abs" | "cardio" | "stretch");
      if (idx > 0) {
        setExtraCategory(EXTRA_CATEGORIES[idx - 1]);
        return;
      }
    }
    const idx = STEPS.indexOf(step);
    if (idx > 0) next(STEPS[idx - 1]);
  }

  function toggleExtra(category: ExtraCategory, optionId: string) {
    setExtras((prev) => ({ ...prev, [category]: prev[category] === optionId ? null : optionId }));
    setTimeout(() => advanceExtraCategory(), 500);
  }

  function skipExtraCategory() {
    setExtras((prev) => ({ ...prev, [extraCategory]: null }));
    advanceExtraCategory();
  }

  function advanceExtraCategory() {
    const EXTRA_CATEGORIES = ["abs", "cardio", "stretch"] as const;
    const idx = EXTRA_CATEGORIES.indexOf(extraCategory as "abs" | "cardio" | "stretch");
    if (idx < EXTRA_CATEGORIES.length - 1) {
      setExtraCategory(EXTRA_CATEGORIES[idx + 1]);
    } else {
      next("saving");
    }
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      setNotifResult("denied");
      return;
    }
    const result = await Notification.requestPermission();
    setNotifResult(result);
  }

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
      setTimeout(() => next("pwa"), 1200);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== "ready") return;
    const t = setTimeout(() => {
      setFade(true);
      setTimeout(() => onDone(), 400);
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ─── Step buttons (bottom actions) ──────────────────────────────

  function StepActions() {
    if (step === "saving" || step === "ready") return null;
    return (
      <div className="pb-12 pt-4">
        {/* Step dots — fluid drip animation on active dot */}
        <div key={step} className="flex justify-center gap-2 mb-5">
          {STEPS.filter(s => s !== "saving" && s !== "ready").map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full ${s === step ? "bg-accent" : "bg-border w-1.5"}`}
              style={s === step ? {
                animation: "dot-drip 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              } : {
                transition: "width 300ms ease",
              }}
            />
          ))}
        </div>

        {step === "about" && (
          <button onClick={() => next("theme")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">
            Continue
          </button>
        )}
        {step === "theme" && (
          <button onClick={() => next("unit")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">
            Continue
          </button>
        )}
        {step === "unit" && (
          <button onClick={() => next("gender")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">
            Continue
          </button>
        )}
        {step === "gender" && (
          <button onClick={() => next("goal")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">
            Continue
          </button>
        )}
        {step === "goal" && (
          <button onClick={() => next("plan")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">
            Continue
          </button>
        )}
        {step === "plan" && (
          <button
            onClick={() => next("extras")}
            disabled={!selectedPlan}
            className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Continue
          </button>
        )}
        {step === "pwa" && (
          <button onClick={() => next("notifications")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">
            Continue
          </button>
        )}
        {step === "notifications" && notifResult === null && (
          <div className="space-y-2">
            <button onClick={requestNotifications} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">
              Enable notifications
            </button>
            <button onClick={() => next("ready")} className="w-full h-12 border-2 border-border text-muted font-medium rounded-lg text-sm hover:border-muted hover:text-text transition-colors">
              Not now
            </button>
          </div>
        )}
        {step === "notifications" && notifResult !== null && (
          <button onClick={() => next("ready")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">
            Continue
          </button>
        )}

        <BackButton step={step} onBack={goBack} />
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[300] bg-bg flex flex-col overflow-hidden">
      <div
        className="absolute w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--color-accent)", animation: "welcome-pulse 4s ease-in-out infinite" }}
      />

      <div className="relative z-10 flex-1 flex flex-col max-w-sm w-full mx-auto px-6">
        {/* Step content — fades on exit only */}
        <div
          className={`flex-1 flex flex-col justify-center transition-all duration-300 ${
            fade ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          }`}
        >
          {step === "welcome" && <WelcomeStep onDone={() => next("about")} />}
          {step === "about" && <AboutStep stepNum={stepNum} totalSteps={totalSteps} />}
          {step === "theme" && <ThemeStep stepNum={stepNum} totalSteps={totalSteps} theme={theme} onApply={applyTheme} />}
          {step === "unit" && <UnitStep stepNum={stepNum} totalSteps={totalSteps} unit={unit} onApply={applyUnit} />}
          {step === "gender" && <GenderStep stepNum={stepNum} totalSteps={totalSteps} gender={gender} onSelect={setGender} />}
          {step === "goal" && <GoalStep stepNum={stepNum} totalSteps={totalSteps} goal={goal} onSelect={setGoal} />}
          {step === "plan" && (
            <PlanStep
              stepNum={stepNum}
              totalSteps={totalSteps}
              gender={gender}
              goal={goal}
              recommended={recommended}
              allPlans={allPlans}
              selectedPlan={selectedPlan}
              showAllPlans={showAllPlans}
              onSelectPlan={setSelectedPlan}
              onShowAll={() => setShowAllPlans(true)}
            />
          )}
          {step === "extras" && (
            <ExtrasStep
              stepNum={stepNum}
              totalSteps={totalSteps}
              extraCategory={extraCategory}
              extras={extras}
              onToggle={toggleExtra}
              onSkip={skipExtraCategory}
            />
          )}
          {step === "saving" && <SavingStep savingState={savingState} />}
          {step === "pwa" && <PwaStep stepNum={stepNum} totalSteps={totalSteps} />}
          {step === "notifications" && (
            <NotificationsStep stepNum={stepNum} totalSteps={totalSteps} notifResult={notifResult} />
          )}
          {step === "ready" && <ReadyStep />}
        </div>

        {/* Bottom actions — static, never fades */}
        <StepActions />
      </div>
    </div>
  );
}
