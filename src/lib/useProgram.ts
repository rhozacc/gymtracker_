"use client";

import { useState, useCallback } from "react";
import { PLANS, PlanDefinition } from "./program";

const STORAGE_KEY = "gym-active-plan";
const DEFAULT_PLAN = "upper_lower";

function getStoredPlanId(): string {
  if (typeof window === "undefined") return DEFAULT_PLAN;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_PLAN;
}

export function useProgram() {
  const [planId, setPlanIdState] = useState<string>(getStoredPlanId);

  const setPlan = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setPlanIdState(id);
  }, []);

  const plan: PlanDefinition = PLANS[planId] || PLANS[DEFAULT_PLAN];

  return { planId, plan, setPlan };
}
