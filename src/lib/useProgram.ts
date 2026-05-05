"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "./swr";
import { PLANS, PlanDefinition, DayDefinition, registerPlans } from "./program";
import type { ApiPlan, ApiPreferences } from "./db-types";
import { usePreferencesSWR } from "./swr-hooks";

const STORAGE_KEY = "gym-active-plan";
const DEFAULT_PLAN = "upper_lower";

type DbPlan = ApiPlan & { days: Record<string, DayDefinition> };

function getStoredPlanSlug(): string {
  if (typeof window === "undefined") return DEFAULT_PLAN;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_PLAN;
}

function dbPlanToDefinition(p: DbPlan): PlanDefinition {
  // Merge category/goal from built-in PLANS constant (not stored in DB)
  const builtIn = PLANS[p.slug];
  return {
    id: p.slug,
    name: p.name,
    description: p.description,
    fit: builtIn?.fit || "",
    category: (builtIn?.category || "") as PlanDefinition["category"],
    goal: (builtIn?.goal || "") as PlanDefinition["goal"],
    days: p.days,
  };
}

export function useProgram() {
  const [planSlug, setPlanSlugState] = useState<string>(getStoredPlanSlug);
  // Plans come back as ApiPlan from /api/plans; we trust built-in plans to
  // match the stricter DbPlan shape at runtime.
  const { data: dbPlans, mutate } = useSWR<DbPlan[]>("/api/plans", fetcher);
  const { data: prefs, mutate: mutatePrefs } = usePreferencesSWR();

  // Sync from DB preferences on load (DB is source of truth, localStorage is cache)
  const syncedFromDb = useMemo(() => {
    if (!prefs?.activePlan) return false;
    const dbSlug = prefs.activePlan;
    const localSlug = getStoredPlanSlug();
    if (dbSlug !== localSlug) {
      localStorage.setItem(STORAGE_KEY, dbSlug);
    }
    return dbSlug;
  }, [prefs]);

  // Use DB value once available, otherwise localStorage
  const effectiveSlug = syncedFromDb || planSlug;

  // Build plan registry from DB data
  const plans: Record<string, PlanDefinition> = useMemo(() => {
    if (!dbPlans) return PLANS;
    const map: Record<string, PlanDefinition> = {};
    for (const p of dbPlans) {
      map[p.slug] = dbPlanToDefinition(p);
    }
    registerPlans(map);
    return map;
  }, [dbPlans]);

  const plan: PlanDefinition = plans[effectiveSlug] || plans[DEFAULT_PLAN] || PLANS[DEFAULT_PLAN];

  const setPlan = useCallback((slug: string) => {
    localStorage.setItem(STORAGE_KEY, slug);
    setPlanSlugState(slug);
    // Optimistically update prefs cache so effectiveSlug reflects the change immediately
    mutatePrefs((prev) => ({
      onboarded: prev?.onboarded ?? false,
      activePlan: slug,
      theme: prev?.theme ?? "dark",
      unit: prev?.unit ?? "kg",
      dayOrder: prev?.dayOrder,
      onboardingStep: prev?.onboardingStep,
    }), false);
    // Persist to DB; revalidate on failure so stale optimistic state doesn't linger
    fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activePlan: slug }),
    }).then((res) => {
      if (!res.ok) mutatePrefs();
    }).catch(() => {
      mutatePrefs();
    });
  }, [mutatePrefs]);

  const refreshPlans = useCallback(() => {
    mutate();
  }, [mutate]);

  return { planId: effectiveSlug, plan, plans, setPlan, refreshPlans, isLoading: !dbPlans };
}
