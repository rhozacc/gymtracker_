"use client";

import { EXTRAS_BY_CATEGORY, CATEGORY_INFO, type ExtraCategory, type ExtrasSelection } from "@/lib/extras";
import { GOAL_INFO, EXTRA_CATEGORIES, type Gender, type Goal, type EnrichedPlan } from "./types";
import { isStandalone } from "./utils";

// ─── Shared sub-components ───────────────────────────────────────────

function StepHeader({ stepNum, totalSteps }: { stepNum: number; totalSteps: number }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-muted mb-6">
      Step {stepNum} of {totalSteps}
    </p>
  );
}

export function PlanCard({
  p,
  selectedPlan,
  onSelect,
}: {
  p: EnrichedPlan;
  selectedPlan: string;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(p.id)}
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

// ─── Step components ─────────────────────────────────────────────────

export function WelcomeStep() {
  return (
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
        gymtracker_
      </h1>
      <p
        className="text-muted text-sm"
        style={{ animation: "welcome-text-in 0.6s ease-out 0.2s both" }}
      >
        Track sessions. Progressive overload. Stay consistent.
      </p>
    </div>
  );
}

export function AboutStep({ stepNum, totalSteps }: { stepNum: number; totalSteps: number }) {
  return (
    <div className="text-center pt-8">
      <StepHeader stepNum={stepNum} totalSteps={totalSteps} />
      <h2 className="text-lg font-medium text-text mb-2">What is gymtracker_?</h2>
      <p className="text-muted text-xs mb-8">Your personal gym companion</p>
      <div className="space-y-4 text-left">
        {[
          { num: "01", title: "Track every session", desc: "Log weight, reps, and RIR for each set" },
          { num: "02", title: "Progressive overload", desc: "Smart feedback tells you when to add weight" },
          { num: "03", title: "Guided sessions", desc: "Step-by-step workouts with rest timers" },
          { num: "04", title: "Track your trends", desc: "Charts, strength progression, and muscle balance" },
        ].map(({ num, title, desc }) => (
          <div key={num} className="flex items-start gap-3">
            <span className="text-accent text-sm mt-0.5">{num}</span>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-muted text-xs">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThemeStep({
  stepNum,
  totalSteps,
  theme,
  onApply,
}: {
  stepNum: number;
  totalSteps: number;
  theme: "dark" | "light" | "system";
  onApply: (t: "dark" | "light" | "system") => void;
}) {
  return (
    <div className="text-center pt-8">
      <StepHeader stepNum={stepNum} totalSteps={totalSteps} />
      <h2 className="text-lg font-medium text-text mb-2">Pick your vibe</h2>
      <p className="text-muted text-xs mb-8">You can change this later</p>
      <div className="flex gap-3">
        <button
          onClick={() => onApply("dark")}
          className={`flex-1 aspect-[3/4] rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
            theme === "dark" ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-muted"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-[#222] flex items-center justify-center">
            <span className="text-[#39ff14] text-lg">&#9679;</span>
          </div>
          <span className={`text-xs font-medium ${theme === "dark" ? "text-accent" : "text-muted"}`}>
            Dark
          </span>
        </button>
        <button
          onClick={() => onApply("system")}
          className={`flex-1 aspect-[3/4] rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
            theme === "system" ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-muted"
          }`}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-border flex">
            <div className="w-1/2 h-full bg-[#0a0a0a]" />
            <div className="w-1/2 h-full bg-[#f5f5f5]" />
          </div>
          <span className={`text-xs font-medium ${theme === "system" ? "text-accent" : "text-muted"}`}>
            Auto
          </span>
        </button>
        <button
          onClick={() => onApply("light")}
          className={`flex-1 aspect-[3/4] rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
            theme === "light" ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-muted"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#f5f5f5] border border-[#e0e0e0] flex items-center justify-center">
            <span className="text-[#d4622b] text-lg">&#9679;</span>
          </div>
          <span className={`text-xs font-medium ${theme === "light" ? "text-accent" : "text-muted"}`}>
            Light
          </span>
        </button>
      </div>
    </div>
  );
}

export function UnitStep({
  stepNum,
  totalSteps,
  unit,
  onApply,
}: {
  stepNum: number;
  totalSteps: number;
  unit: "kg" | "lbs";
  onApply: (u: "kg" | "lbs") => void;
}) {
  return (
    <div className="text-center pt-8">
      <StepHeader stepNum={stepNum} totalSteps={totalSteps} />
      <h2 className="text-lg font-medium text-text mb-2">Weight unit</h2>
      <p className="text-muted text-xs mb-8">All data stored in kg, display converts</p>
      <div className="flex gap-3">
        {(["kg", "lbs"] as const).map((u) => (
          <button
            key={u}
            onClick={() => onApply(u)}
            className={`flex-1 h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
              unit === u ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-muted"
            }`}
          >
            <span className={`text-2xl font-bold ${unit === u ? "text-accent" : "text-text"}`}>
              {u.toUpperCase()}
            </span>
            <span className="text-[10px] text-muted">{u === "kg" ? "Kilograms" : "Pounds"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function GenderStep({
  stepNum,
  totalSteps,
  gender,
  onSelect,
}: {
  stepNum: number;
  totalSteps: number;
  gender: Gender;
  onSelect: (g: Gender) => void;
}) {
  return (
    <div className="text-center pt-8">
      <StepHeader stepNum={stepNum} totalSteps={totalSteps} />
      <h2 className="text-lg font-medium text-text mb-2">Training style</h2>
      <p className="text-muted text-xs mb-8">This determines which plans we recommend</p>
      <div className="flex gap-3">
        {([["men", "M", "Men's"], ["women", "F", "Women's"]] as const).map(([val, letter, label]) => (
          <button
            key={val}
            onClick={() => onSelect(val)}
            className={`flex-1 h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
              gender === val ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-muted"
            }`}
          >
            <span className={`text-2xl ${gender === val ? "text-accent" : "text-text"}`}>{letter}</span>
            <span className="text-[10px] text-muted">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function GoalStep({
  stepNum,
  totalSteps,
  goal,
  onSelect,
}: {
  stepNum: number;
  totalSteps: number;
  goal: Goal;
  onSelect: (g: Goal) => void;
}) {
  return (
    <div className="text-center pt-8">
      <StepHeader stepNum={stepNum} totalSteps={totalSteps} />
      <h2 className="text-lg font-medium text-text mb-2">What&apos;s your goal?</h2>
      <p className="text-muted text-xs mb-6">We&apos;ll recommend plans that match</p>
      <div className="space-y-3">
        {(["bulk", "balanced", "lean"] as Goal[]).map((g) => (
          <button
            key={g}
            onClick={() => onSelect(g)}
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
    </div>
  );
}

export function PlanStep({
  stepNum,
  totalSteps,
  gender,
  goal,
  recommended,
  allPlans,
  selectedPlan,
  showAllPlans,
  onSelectPlan,
  onShowAll,
}: {
  stepNum: number;
  totalSteps: number;
  gender: Gender;
  goal: Goal;
  recommended: EnrichedPlan[];
  allPlans: EnrichedPlan[];
  selectedPlan: string;
  showAllPlans: boolean;
  onSelectPlan: (id: string) => void;
  onShowAll: () => void;
}) {
  return (
    <div className="pt-8">
      <p className="text-[10px] uppercase tracking-widest text-muted mb-6 text-center">
        Step {stepNum} of {totalSteps}
      </p>
      <h2 className="text-lg font-medium text-text mb-2 text-center">Pick a plan</h2>
      <p className="text-muted text-xs mb-4 text-center">
        Recommended for {GOAL_INFO[goal].label.toLowerCase()}
      </p>
      <div className="max-h-[45vh] overflow-y-auto space-y-1 mb-4 -mx-1 px-1">
        {recommended.length > 0 ? (
          recommended.map((p) => (
            <PlanCard key={p.id} p={p} selectedPlan={selectedPlan} onSelect={onSelectPlan} />
          ))
        ) : (
          <div className="h-16 bg-surface rounded animate-pulse" />
        )}
        {!showAllPlans && allPlans.length > recommended.length && (
          <button
            onClick={onShowAll}
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
                <PlanCard key={p.id} p={p} selectedPlan={selectedPlan} onSelect={onSelectPlan} />
              ))}
          </>
        )}
      </div>
    </div>
  );
}

export function ExtrasStep({
  stepNum,
  totalSteps,
  extraCategory,
  extras,
  onToggle,
  onSkip,
}: {
  stepNum: number;
  totalSteps: number;
  extraCategory: ExtraCategory;
  extras: ExtrasSelection;
  onToggle: (category: ExtraCategory, id: string) => void;
  onSkip: () => void;
}) {
  return (
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
      <div className="flex gap-2 justify-center mb-6">
        {EXTRA_CATEGORIES.map((cat) => (
          <div
            key={cat}
            className={`h-1 w-8 rounded-full transition-colors ${
              cat === extraCategory
                ? "bg-accent"
                : EXTRA_CATEGORIES.indexOf(cat) < EXTRA_CATEGORIES.indexOf(extraCategory)
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
            onClick={() => onToggle(extraCategory, opt.id)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
              extras[extraCategory] === opt.id
                ? "border-accent bg-accent text-bg"
                : "border-border hover:border-muted"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${extras[extraCategory] === opt.id ? "text-bg" : ""}`}>
                {opt.name}
              </span>
              <span className={`text-[10px] ${extras[extraCategory] === opt.id ? "text-bg/70" : "text-muted"}`}>
                {opt.duration}
              </span>
            </div>
            <p className={`text-xs mt-1 ${extras[extraCategory] === opt.id ? "text-bg/70" : "text-muted"}`}>
              {opt.description}
            </p>
          </button>
        ))}
      </div>
      <button
        onClick={onSkip}
        className="w-full text-center py-2 text-xs text-muted hover:text-accent transition-colors"
      >
        Skip
      </button>
    </div>
  );
}

export function SavingStep({ savingState }: { savingState: "saving" | "done" | null }) {
  return (
    <div className="text-center">
      <div className="mb-6">
        {savingState === "done" ? (
          <div className="text-accent" style={{ animation: "welcome-icon-in 0.4s ease-out" }}>
            <svg
              width="56" height="56" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
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
        {savingState === "done" ? "Everything is set up" : "Setting up your training plan..."}
      </p>
    </div>
  );
}

export function NavStep({ stepNum, totalSteps }: { stepNum: number; totalSteps: number }) {
  const tabs = [
    { label: "Home", desc: "Dashboard, next session, streaks", letter: "H" },
    { label: "Plan", desc: "Your training plan and extras", letter: "P" },
    { label: "Log", desc: "Session history and details", letter: "L" },
    { label: "Trends", desc: "Charts, strength, volume tracking", letter: "T" },
  ];
  return (
    <div className="text-center pt-8">
      <StepHeader stepNum={stepNum} totalSteps={totalSteps} />
      <h2 className="text-lg font-medium text-text mb-2">Navigation</h2>
      <p className="text-muted text-xs mb-6">Swipe or tap to switch between tabs</p>
      <div className="space-y-3">
        {tabs.map((tab) => (
          <div key={tab.label} className="flex items-center gap-4 p-3 rounded-lg border border-border">
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
    </div>
  );
}

export function PwaStep({ stepNum, totalSteps }: { stepNum: number; totalSteps: number }) {
  const standalone = isStandalone();
  return (
    <div className="text-center pt-8">
      <StepHeader stepNum={stepNum} totalSteps={totalSteps} />
      <h2 className="text-lg font-medium text-text mb-2">Install the app</h2>
      {standalone ? (
        <>
          <div className="text-accent mb-6" style={{ animation: "welcome-icon-in 0.4s ease-out" }}>
            <svg
              width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className="mx-auto"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>
          <p className="text-muted text-xs">Already installed. You&apos;re good!</p>
        </>
      ) : (
        <>
          <p className="text-muted text-xs mb-6">
            For the best experience, add gymtracker_ to your home screen
          </p>
          <div className="text-left space-y-3 border border-border rounded-lg p-4">
            {[
              ["1.", <><span className="text-text font-medium">Share</span> button in your browser</>],
              ["2.", <>Select <span className="text-text font-medium">Add to Home Screen</span></>],
              ["3.", <>Open gymtracker_ from your home screen</>],
            ].map(([num, text], i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-accent text-sm font-medium">{num}</span>
                <p className="text-xs text-muted">Tap the {text}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function NotificationsStep({
  stepNum,
  totalSteps,
  notifResult,
}: {
  stepNum: number;
  totalSteps: number;
  notifResult: "granted" | "denied" | "default" | null;
}) {
  return (
    <div className="text-center pt-8">
      <StepHeader stepNum={stepNum} totalSteps={totalSteps} />
      <h2 className="text-lg font-medium text-text mb-2">Notifications</h2>
      <p className="text-muted text-xs mb-8">
        Get notified when your rest timer ends, even with the screen locked
      </p>
      {notifResult !== null && (
        <div>
          <div
            className={`mb-6 ${notifResult === "granted" ? "text-accent" : "text-muted"}`}
            style={{ animation: "welcome-icon-in 0.4s ease-out" }}
          >
            {notifResult === "granted" ? (
              <svg
                width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className="mx-auto"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            ) : (
              <svg
                width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className="mx-auto"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </div>
          <p className="text-muted text-xs">
            {notifResult === "granted"
              ? "Notifications enabled"
              : "No worries — you can enable them later in settings"}
          </p>
        </div>
      )}
    </div>
  );
}

export function ReadyStep() {
  return (
    <div className="text-center">
      <div className="text-accent mb-6" style={{ animation: "welcome-icon-in 0.5s ease-out" }}>
        <svg
          width="64" height="64" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className="mx-auto"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <h2
        className="text-2xl font-semibold text-text mb-2"
        style={{ animation: "welcome-text-in 0.5s ease-out 0.1s both" }}
      >
        Ready
      </h2>
      <p
        className="text-muted text-sm"
        style={{ animation: "welcome-text-in 0.5s ease-out 0.15s both" }}
      >
        Let&apos;s get to work.
      </p>
    </div>
  );
}
