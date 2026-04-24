"use client";

import { useState, useEffect } from "react";
import { usePlansSWR, usePreferencesSWR } from "@/lib/swr-hooks";
import {
  STEPS,
  NUMBERED_STEPS,
  type Step,
  type Gender,
  type Goal,
  type EnrichedPlan,
} from "./types";
import {
  enrichDbPlans,
  getRecommendedDb,
  getAllForGenderDb,
  getRecommendedFallback,
  getAllForGenderFallback,
  savePrefs,
} from "./utils";
import {
  WelcomeStep,
  AboutStep,
  ThemeStep,
  UnitStep,
  GenderStep,
  GoalStep,
  PlanStep,
  SavingStep,
  PwaStep,
  WarmupTipsStep,
  NotificationsStep,
  ReadyStep,
} from "./WelcomeSteps";
import { fireLaser } from "@/lib/useTheme";

// ─── useOnboarded hook ───────────────────────────────────────────────

export const ONBOARDING_STEP_KEY = "gym-onboarding-step";

const VALID_RESUME_STEPS = new Set<Step>(
  STEPS.filter((s) => s !== "saving" && s !== "ready" && s !== "welcome")
);

export function useOnboarded() {
  const { data, isLoading } = usePreferencesSWR();

  let localOnboarded = false;
  let localStep: Step | null = null;
  if (typeof window !== "undefined") {
    localOnboarded = localStorage.getItem("gym-onboarded") === "true";
    const raw = localStorage.getItem(ONBOARDING_STEP_KEY) as Step | null;
    if (raw && VALID_RESUME_STEPS.has(raw)) localStep = raw;
  }

  // API-persisted step — used when PWA opens with empty localStorage
  const apiStep = (data?.onboardingStep as Step | null | undefined) ?? null;
  const resumeStep: Step | null =
    localStep ?? (apiStep && VALID_RESUME_STEPS.has(apiStep) ? apiStep : null);

  const inProgress = !!resumeStep;

  return {
    onboarded: !inProgress && (localOnboarded || (data?.onboarded ?? false)),
    checked: localOnboarded || !isLoading,
    savedStep: resumeStep,
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

export function Welcome({ onDone, initialStep }: { onDone: () => void; initialStep?: Step | null }) {
  const [step, setStep] = useState<Step>(() => {
    if (typeof window === "undefined") return initialStep ?? "welcome";
    // Local storage takes priority (same-browser sessions), then API-provided step
    const saved = localStorage.getItem(ONBOARDING_STEP_KEY) as Step | null;
    if (saved && VALID_RESUME_STEPS.has(saved)) return saved;
    if (initialStep && VALID_RESUME_STEPS.has(initialStep)) return initialStep;
    return "welcome";
  });
  const [theme, setTheme] = useState<"dark" | "light" | "system">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("gym-theme");
    if (stored === "dark" || stored === "light" || stored === "system") return stored;
    return "dark";
  });
  const [darkAccent, setDarkAccentState] = useState<string>(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem("gym-accent-dark") || "#39ff14")
      : "#39ff14"
  );
  const [lightAccent, setLightAccentState] = useState<string>(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem("gym-accent-light") || "#d4622b")
      : "#d4622b"
  );
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [gender, setGender] = useState<Gender>("men");
  const [goal, setGoal] = useState<Goal>("balanced");
  const [selectedPlan, setSelectedPlan] = useState("upper_lower");
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [fade, setFade] = useState(false);
  const [savingState, setSavingState] = useState<"saving" | "done" | null>(null);
  const [notifResult, setNotifResult] = useState<"granted" | "denied" | "default" | null>(null);

  const { data: rawPlans } = usePlansSWR();
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
    const storedAccent = localStorage.getItem(resolved === "dark" ? "gym-accent-dark" : "gym-accent-light")
      || (resolved === "dark" ? "#39ff14" : "#d4622b");
    const r = document.documentElement.style;
    r.setProperty("--color-accent", storedAccent);
    r.setProperty("--color-chart-bar-1", storedAccent);
    r.setProperty("--color-chart-line", storedAccent);
    fireLaser(); // after DOM is updated — laser shows new accent color
  }

  function handleAccent(color: string, forTheme: "dark" | "light") {
    const key = forTheme === "dark" ? "gym-accent-dark" : "gym-accent-light";
    localStorage.setItem(key, color);
    if (forTheme === "dark") setDarkAccentState(color);
    else setLightAccentState(color);
    const r = document.documentElement.style;
    r.setProperty("--color-accent", color);
    r.setProperty("--color-chart-bar-1", color);
    r.setProperty("--color-chart-line", color);
    fireLaser(); // after DOM is updated — laser shows new accent color
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
      if (VALID_RESUME_STEPS.has(nextStep)) {
        // Persist to localStorage (same-browser) AND DB (cross-context: PWA after install)
        localStorage.setItem(ONBOARDING_STEP_KEY, nextStep);
        savePrefs({ onboardingStep: nextStep });
      } else {
        localStorage.removeItem(ONBOARDING_STEP_KEY);
      }
    }, 300);
  }

  function goBack() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) next(STEPS[idx - 1]);
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      setNotifResult("denied");
      return;
    }
    const result = await Notification.requestPermission();
    setNotifResult(result);
    if (result === "granted") {
      const { subscribeToPush } = await import("@/lib/push-subscribe");
      subscribeToPush().catch(() => {});
    }
  }

  useEffect(() => {
    if (step !== "saving") return;
    setSavingState("saving");
    // Save plan/theme/unit but NOT onboarded:true yet — so iOS PWA opening mid-flow
    // won't be routed to home before finishing pwa/notifications/ready steps.
    savePrefs({ activePlan: selectedPlan, theme, unit }).then(() => {
      localStorage.setItem("gym-active-plan", selectedPlan);
      setSavingState("done");
      setTimeout(() => next("pwa"), 1200);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== "ready") return;
    // Mark onboarding fully complete — set onboarded:true and clear the step in DB + localStorage
    savePrefs({ onboarded: true, onboardingStep: null });
    localStorage.setItem("gym-onboarded", "true");
    localStorage.removeItem(ONBOARDING_STEP_KEY);

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
            onClick={() => next("saving")}
            disabled={!selectedPlan}
            className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Continue
          </button>
        )}
        {step === "pwa" && (
          <button onClick={() => next("warmup-tips")} className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity">
            Continue
          </button>
        )}
        {step === "warmup-tips" && (
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
          {step === "theme" && <ThemeStep stepNum={stepNum} totalSteps={totalSteps} theme={theme} darkAccent={darkAccent} lightAccent={lightAccent} onApply={applyTheme} onAccent={handleAccent} />}
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
          {step === "saving" && <SavingStep savingState={savingState} />}
          {step === "pwa" && <PwaStep stepNum={stepNum} totalSteps={totalSteps} />}
          {step === "warmup-tips" && <WarmupTipsStep stepNum={stepNum} totalSteps={totalSteps} />}
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
