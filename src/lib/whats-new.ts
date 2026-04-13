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
    area: "Weight nudges",
    text: "Between sets the app now suggests going up or down based on your reps and RIR. Tap the chip to apply it instantly — or ignore it.",
  },
  {
    area: "Guided session",
    text: "Navigate forward and back between sets with the arrow button. Switching to list view and back now resumes exactly where you left off — no more teleporting to the first exercise.",
  },
  {
    area: "Rest timer",
    text: "Notifications no longer double-fire. If the app is open when rest ends, only the in-app beep plays — no system notification. Warmup sets show a Done button even while the rest timer counts down so you can log the warmup without waiting.",
  },
  {
    area: "Warmup weight",
    text: "Warmup is now prefilled at 50% of your last actual working weight, not the overload target — so it's always grounded in what you actually lifted.",
  },
  {
    area: "Alternatives",
    text: "Gym packed? Tap the fork icon next to any exercise to swap to an alternative for the session. Both are tracked separately so your progress lines stay clean.",
  },
  {
    area: "Session complete",
    text: "Finishing a session goes straight to debrief — no redundant extras checklist. Done button now animates and always navigates home, even on a network hiccup.",
  },
  {
    area: "Extras",
    text: "Rest between extras now shows the same draining progress bar as the main session. The intro screen lists every exercise with reps or hold time so you know what you're getting into.",
  },
  {
    area: "Onboarding",
    text: "Onboarding now resumes where you left off if you close the app mid-flow. iOS users installing to home screen won't be dropped to the home screen before finishing setup.",
  },
  {
    area: "Rest timer",
    text: "Progress bar now drains instead of filling — shows time remaining at a glance. Tapping 'Skip Rest' triggers a full-screen flash so you always know it registered.",
  },
  {
    area: "Stats",
    text: "Exercise stats now show your actual max weight (solid dot) alongside the estimated 1RM (lighter dot), so you see real numbers first. If you're ready to load up, the target weight appears as a dashed line on the chart.",
  },
  {
    area: "Activity",
    text: "Activity heatmap now fills the full page width and auto-fits as many weeks as possible — no wasted space on wider screens.",
  },
  {
    area: "Muscle groups",
    text: "Muscle radar now uses the trailing 7 days instead of the calendar week, so Monday doesn't wipe your weekly view.",
  },
  {
    area: "Stats",
    text: "New per-exercise Stats page — tap any exercise in Load up (or open Stats from the home screen) to see your strength over time with dots for past sessions and a projected trend line.",
  },
  {
    area: "Load up",
    text: "Load up exercises are now tappable and link directly to their stats page. Tap the northeast arrow to browse all exercises.",
  },
  {
    area: "Exercise guide",
    text: "Tap the (i) next to any exercise name during a session or in history to open a how-to guide on Muscle & Strength.",
  },
  {
    area: "Accent colors",
    text: "Pick your color. Three neons for dark mode, three bold tones for light — each theme keeps its own. Change anytime in Settings or during onboarding.",
  },
  {
    area: "Laser transitions",
    text: "Switching theme or accent fires a neon laser sweep across the screen. The laser color matches whatever you just picked.",
  },
];
