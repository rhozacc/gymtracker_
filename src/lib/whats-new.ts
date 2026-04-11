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
    area: "Warmup sets",
    text: "Warmup weight now shows as ~N kg, rounded to the nearest plate increment. Skip warmup 3+ times to unlock Disable Warmups Forever.",
  },
  {
    area: "Smart extras",
    text: "After your session, the app picks one routine for you — abs, cardio, or stretch — based on your workout type, session length, and history.",
  },
  {
    area: "Settings",
    text: "New Workout section: toggle post-session extras and post-workout debrief on or off independently.",
  },
  {
    area: "Onboarding",
    text: "Setup is now shorter — extras are handled automatically, no manual category selection needed.",
  },
  {
    area: "Analytics",
    text: "Vercel Analytics added for performance monitoring.",
  },
];
