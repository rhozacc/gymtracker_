// Edit this before each deploy to describe what changed.
// Format: { area: string, text: string }[] — one entry per changed area.
// 'area' = short name rendered as an accent-colored H2.
// 'text' = 1–2 sentences describing the change for the user.
// UpdateSplash renders each entry as H2 (accent color) + paragraph.

export interface WhatsNewEntry {
  area: string;
  text: string;
}

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    area: "Momentum, refined",
    text: "Cleaner bars for Volume and Lifts, with triangle markers for the Atrophy / Maintenance / Hypertrophy thresholds. See your training state at a glance.",
  },
  {
    area: "Tidier home screen",
    text: "Last Session moved below Progress so the Momentum headline and your next workout sit side by side at the top.",
  },
];
