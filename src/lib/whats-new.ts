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
    area: "Plan switching",
    text: "Sorry Jakob — fixed a bug where plan selection would revert to default. You can now switch training types without them reverting. That was our bad.",
  },
  {
    area: "Momentum breakdown",
    text: "Tap Momentum on the home page to see the receipts: every muscle group vs MEV / MAV, every repeated lift's 14-day E1RM delta, and your recovery signal.",
  },
];
