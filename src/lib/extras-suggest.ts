// Smart post-session extras suggestion engine.
// Picks one ExtraOption from the existing library based on:
//   • what muscle groups were trained (dayType)
//   • how long the session ran (duration fit)
//   • recent history (rotates categories, avoids repeating the same option)

import { EXTRAS_BY_CATEGORY, type ExtraCategory, type ExtraOption } from "./extras";

// ─── Extras Vibes (user preference hints) ────────────────────────────────────

interface ExtrasVibes {
  categoryBias: "none" | "abs" | "cardio" | "stretch";
  duration: "any" | "quick" | "longer";
}

function getExtrasVibes(): ExtrasVibes {
  if (typeof window === "undefined") return { categoryBias: "none", duration: "any" };
  try {
    const raw = JSON.parse(localStorage.getItem("gym-extras-vibes") || "{}");
    return { categoryBias: raw.categoryBias || "none", duration: raw.duration || "any" };
  } catch {
    return { categoryBias: "none", duration: "any" };
  }
}

// ─── History ─────────────────────────────────────────────────────────────────

const HISTORY_KEY = "gym-extras-history";
const MAX_HISTORY = 14;

interface HistoryEntry {
  routineId: string;
  type: ExtraCategory;
  dayType: string;
  date: string; // ISO
}

export function getExtrasHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function recordExtrasHistory(
  routineId: string,
  type: ExtraCategory,
  dayType: string
) {
  const history = getExtrasHistory();
  history.unshift({ routineId, type, dayType, date: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

// ─── Day-type → preferred category ───────────────────────────────────────────

// Keywords in the dayType URL param → ordered list of preferred categories
const DAY_AFFINITIES: [string, ExtraCategory[]][] = [
  ["push",  ["stretch", "abs"]],
  ["chest", ["stretch", "abs"]],
  ["pull",  ["stretch", "abs"]],
  ["back",  ["stretch", "abs"]],
  ["legs",  ["stretch", "cardio"]],
  ["lower", ["stretch", "cardio"]],
  ["upper", ["stretch", "abs"]],
  ["full",  ["abs", "stretch"]],
];

function preferredCategories(dayType: string): ExtraCategory[] {
  const lower = dayType.toLowerCase();
  for (const [key, cats] of DAY_AFFINITIES) {
    if (lower.includes(key)) return cats;
  }
  // Generic day (A/B/C/D style) — rotate evenly, handled by recency scoring
  return ["abs", "cardio", "stretch"];
}

// ─── Duration hint from the option's duration string ("~4 min" → 4) ──────────

function parseMins(duration: string): number {
  const m = duration.match(/(\d+)/);
  return m ? parseInt(m[1]) : 5;
}

// ─── Main suggestion function ─────────────────────────────────────────────────

export function suggestExtra(
  dayType: string,
  sessionDurationMins: number
): ExtraOption {
  const history = getExtrasHistory();
  const prefCats = preferredCategories(dayType);
  const vibes = getExtrasVibes();

  const allOptions = [
    ...EXTRAS_BY_CATEGORY.abs,
    ...EXTRAS_BY_CATEGORY.cardio,
    ...EXTRAS_BY_CATEGORY.stretch,
  ];

  const scored = allOptions.map((opt) => {
    let score = 0;

    // ① Category affinity based on day type
    const catRank = prefCats.indexOf(opt.category);
    if (catRank === 0) score += 6;
    else if (catRank === 1) score += 3;

    // ① bonus: day-specific stretch options get a strong nudge when they match
    const lower = dayType.toLowerCase();
    if (opt.id === "stretch_post_legs" && (lower.includes("leg") || lower.includes("lower"))) score += 5;
    if (opt.id === "stretch_post_push" && (lower.includes("push") || lower.includes("chest"))) score += 5;
    if (opt.id === "stretch_post_pull" && (lower.includes("pull") || lower.includes("back")))  score += 5;

    // ② Recency penalty — same option
    const lastSeen = history.findIndex((h) => h.routineId === opt.id);
    if (lastSeen === 0) score -= 12; // just did this exact one
    else if (lastSeen === 1) score -= 6;
    else if (lastSeen <= 3) score -= 2;

    // ③ Recency penalty — same category (encourages rotation)
    const recentSameCat = history.slice(0, 3).filter(
      (h) => h.type === opt.category
    ).length;
    score -= recentSameCat * 3;

    // ④ Duration fit
    const mins = parseMins(opt.duration);
    if (sessionDurationMins > 70) {
      // Long session → prefer quick options
      if (mins <= 5) score += 4;
      else if (mins <= 8) score += 1;
      else score -= 2;
    } else if (sessionDurationMins < 40) {
      // Short session → mid options feel more rewarding
      if (mins >= 8 && mins <= 12) score += 3;
      else if (mins >= 5) score += 1;
    } else {
      // Average session — slight preference for quick/mid
      if (mins <= 8) score += 2;
    }

    // ⑤ Extras Vibes — user preference nudges
    if (vibes.categoryBias !== "none" && opt.category === vibes.categoryBias) score += 4;
    if (vibes.duration === "quick" && mins <= 5) score += 3;
    else if (vibes.duration === "longer" && mins >= 10) score += 3;

    // ⑥ Small random tiebreak (so it doesn't always pick the same one)
    score += Math.random() * 0.5;

    return { opt, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].opt;
}
