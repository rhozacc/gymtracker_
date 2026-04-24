/**
 * Shared shapes for API responses and DB-derived models. Kept in one place so
 * `/api/plans`, `/api/preferences`, useProgram, and the welcome/onboarding
 * flow don't drift out of sync.
 */

/** Raw `Plan` row as returned by `/api/plans`. */
export interface ApiPlan {
  id: string;
  slug: string;
  name: string;
  description: string;
  builtIn: boolean;
  days: Record<string, ApiPlanDay>;
}

export interface ApiPlanDay {
  label: string;
  exercises: { id: string; name?: string; sets?: number; repRange?: [number, number]; increment?: number; rest?: number }[];
}

/** Raw `UserPreferences` row as returned by `/api/preferences`. */
export interface ApiPreferences {
  onboarded: boolean;
  activePlan: string;
  theme: string;
  unit: string;
  dayOrder?: Record<string, string[]>;
  onboardingStep?: string | null;
}
