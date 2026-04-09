"use client";

export type Step =
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

export const STEPS: Step[] = [
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

export const NUMBERED_STEPS: Step[] = [
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

export type Gender = "men" | "women";
export type Goal = "bulk" | "balanced" | "lean";

export const GOAL_INFO: Record<Goal, { label: string; desc: string }> = {
  bulk: { label: "Bulk", desc: "Build size & strength" },
  balanced: { label: "Balanced", desc: "Well-rounded training" },
  lean: { label: "Lean", desc: "Cut & define" },
};

export const EXTRA_CATEGORIES = ["abs", "cardio", "stretch"] as const;
export type ExtraCategoryTuple = typeof EXTRA_CATEGORIES;

export interface Preferences {
  onboarded: boolean;
  activePlan: string;
  theme: string;
  unit: string;
}

export interface DbPlanRaw {
  slug: string;
  name: string;
  description: string;
  builtIn: boolean;
  days: Record<string, { label: string; exercises: { id: string }[] }>;
}

export interface EnrichedPlan {
  id: string;
  name: string;
  description: string;
  category: string;
  goal: string;
  dayCount: number;
}
