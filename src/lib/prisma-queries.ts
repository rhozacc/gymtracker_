import type { Prisma } from "@prisma/client";

/**
 * Shared Prisma `include`/`select` fragments used by multiple API routes so
 * the shapes returned from `/api/sessions`, `/api/volume/weekly`, social
 * endpoints, etc., stay in sync.
 */

/** Include all sets for a session (no ordering). */
export const includeSets = { sets: true } as const satisfies Prisma.SessionInclude;

/** Include sets ordered by (exerciseId asc, setNumber asc) — the canonical
 *  render order for the session detail view. */
export const includeSetsOrdered = {
  sets: { orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }] },
} as const satisfies Prisma.SessionInclude;

/** Narrow select for volume aggregation — only the columns needed to compute
 *  `reps * weight` for non-warmup sets. */
export const selectSetsForVolume = {
  sets: { select: { reps: true, weight: true, isWarmup: true } },
} as const satisfies Prisma.SessionSelect;
