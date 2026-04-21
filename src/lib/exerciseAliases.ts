import { PLANS } from "./program";

const PROGRAM_PREFIXES = [
  "fb_", "pb_", "sc_", "str_", "wppl_",
  "lc_", "lt_", "wfb_", "wul_", "ws_",
];

function isPrefixed(id: string): boolean {
  return PROGRAM_PREFIXES.some((p) => id.startsWith(p));
}

// Collect all { id, name } pairs from every plan (exercises + alternatives)
const allById = new Map<string, string>(); // id → lowercase name
for (const plan of Object.values(PLANS)) {
  for (const day of Object.values(plan.days)) {
    for (const ex of day.exercises) {
      allById.set(ex.id, ex.name.toLowerCase());
      for (const alt of ex.alternatives ?? []) {
        allById.set(alt.id, alt.name.toLowerCase());
      }
    }
  }
}

// name → canonical ID (first non-prefixed ID with this name wins)
const nameToCanonical = new Map<string, string>();
Array.from(allById.entries()).forEach(([id, name]) => {
  if (!isPrefixed(id) && !nameToCanonical.has(name)) {
    nameToCanonical.set(name, id);
  }
});

// alias map: prefixed variant → canonical ID (matched by exercise name)
export const EXERCISE_ALIASES: Record<string, string> = {};
Array.from(allById.entries()).forEach(([id, name]) => {
  if (isPrefixed(id)) {
    const canonical = nameToCanonical.get(name);
    if (canonical) EXERCISE_ALIASES[id] = canonical;
    // No match: exercise has no canonical yet; radar credits 0 until admin assigns contributions
  }
});

export function resolveCanonical(exerciseId: string): string {
  return EXERCISE_ALIASES[exerciseId] ?? exerciseId;
}
