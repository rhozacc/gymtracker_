"use client";

export type Step =
  | "welcome"
  | "about"
  | "theme"
  | "unit"
  | "gender"
  | "goal"
  | "plan"
  | "saving"
  | "pwa"
  | "warmup-tips"
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
  "saving",
  "pwa",
  "warmup-tips",
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
  "pwa",
  "warmup-tips",
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

export type { ApiPreferences as Preferences, ApiPlan as DbPlanRaw } from "@/lib/db-types";

export interface EnrichedPlan {
  id: string;
  name: string;
  description: string;
  category: string;
  goal: string;
  dayCount: number;
}
