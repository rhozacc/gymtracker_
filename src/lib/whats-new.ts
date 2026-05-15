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
    area: "Weight suggestion",
    text: "Smarter starting weight for next session: the app now bases its suggestion on the heaviest set you actually kept in your rep range — so a failed attempt at a new weight no longer inflates what gets loaded next time.",
  },
  {
    area: "Crowded gym",
    text: "Skipped an exercise because the rack was taken? Guided mode now loops back to finish any undone exercises before ending your session — skip now, come back to it later.",
  },
  {
    area: "Plan switching",
    text: "Sorry again Jakob — the previous attempt missed the actual bug. Switching plans was failing at the database layer because all users were sharing one preferences row. Each user now gets their own row, and switching actually persists.",
  },
  {
    area: "Momentum breakdown",
    text: "Tap Momentum on the home page to see the receipts: every muscle group vs MEV / MAV, every repeated lift's 14-day E1RM delta, and your recovery signal.",
  },
];
