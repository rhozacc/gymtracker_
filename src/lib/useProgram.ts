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
  return { id: p.slug, name: p.name, description: p.description, days: p.days };
}

export function useProgram() {
  const [planSlug, setPlanSlugState] = useState<string>(getStoredPlanSlug);
  const { data: dbPlans, mutate } = useSWR<DbPlan[]>("/api/plans", fetcher);

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

  const plan: PlanDefinition = plans[planSlug] || plans[DEFAULT_PLAN] || PLANS[DEFAULT_PLAN];

  const setPlan = useCallback((slug: string) => {
    localStorage.setItem(STORAGE_KEY, slug);
    setPlanSlugState(slug);
  }, []);

  const refreshPlans = useCallback(() => {
    mutate();
  }, [mutate]);

  return { planId: planSlug, plan, plans, setPlan, refreshPlans, isLoading: !dbPlans };
}
