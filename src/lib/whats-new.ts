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
    area: "New Momentum",
    text: "Your training state now headlines the home screen. Volume vs targets and lift progress, side by side — read your last 4 weeks at a glance, with a one-line diagnosis pointing at the actual bottleneck.",
  },
  {
    area: "Blended sessions",
    text: "Train together, no setup. Pick three icons with a friend and tap them in the same order — your plans merge into one shared session. Same exercises, your own loads.",
  },
];
