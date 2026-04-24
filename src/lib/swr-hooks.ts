"use client";

import useSWR from "swr";
import { fetcher } from "./swr";
import type { ApiPlan, ApiPreferences } from "./db-types";

/**
 * Typed SWR wrappers for endpoints that are hit from multiple components.
 * Keeps the `(url, type)` contract in one place so consumers don't drift.
 */

export function usePreferencesSWR() {
  return useSWR<ApiPreferences>("/api/preferences", fetcher);
}

export function usePlansSWR() {
  return useSWR<ApiPlan[]>("/api/plans", fetcher);
}
