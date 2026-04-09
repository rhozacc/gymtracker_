import { PLANS } from "@/lib/program";
import type { ExtrasSelection } from "@/lib/extras";
import type { DbPlanRaw, EnrichedPlan, Gender, Goal, Preferences } from "./types";

export function enrichDbPlans(raw: DbPlanRaw[]): EnrichedPlan[] {
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

export function getRecommendedDb(plans: EnrichedPlan[], gender: Gender, goal: Goal) {
  return plans.filter((p) => p.category === gender && p.goal === goal);
}

export function getAllForGenderDb(plans: EnrichedPlan[], gender: Gender) {
  return plans.filter((p) => p.category === gender);
}

export function getRecommendedFallback(gender: Gender, goal: Goal): EnrichedPlan[] {
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

export function getAllForGenderFallback(gender: Gender): EnrichedPlan[] {
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

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export async function savePrefs(data: Partial<Preferences>) {
  await fetch("/api/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function saveExtras(selection: ExtrasSelection) {
  await fetch("/api/extras", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selection),
  });
}
