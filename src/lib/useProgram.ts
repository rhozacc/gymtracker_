"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "./swr";
import { PLANS, PlanDefinition, DayDefinition, registerPlans } from "./program";

const STORAGE_KEY = "gym-active-plan";
const DEFAULT_PLAN = "upper_lower";

interface DbPlan {
  id: string;
  slug: string;
  name: string;
  description: string;
  builtIn: boolean;
  days: Record<string, DayDefinition>;
}

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

interface Preferences {
  activePlan: string;
}

export function useProgram() {
  const [planSlug, setPlanSlugState] = useState<string>(getStoredPlanSlug);
  const { data: dbPlans, mutate } = useSWR<DbPlan[]>("/api/plans", fetcher);
  const { data: prefs } = useSWR<Preferences>("/api/preferences", fetcher);

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
    // Persist to DB
    fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activePlan: slug }),
    });
  }, []);

  const refreshPlans = useCallback(() => {
    mutate();
  }, [mutate]);

  return { planId: effectiveSlug, plan, plans, setPlan, refreshPlans, isLoading: !dbPlans };
}
