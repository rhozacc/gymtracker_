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
    area: "Momentum",
    text: "A single 0–100 score on your dashboard that tracks consistency, progressive overload, and recovery quality over the last 28 days. Goes up when you are genuinely progressing, drops when spinning wheels or overtraining.",
  },
  {
    area: "Strength standards",
    text: "Each exercise now shows where your best lift sits versus Novice, Intermediate, Advanced, and Elite — and projects how many weeks until the next tier at your current pace.",
  },
  {
    area: "Warmup tracking",
    text: "Warmup sets are now saved to your session history (not counted in volume or stats). This fixes a bug where the first working set could show the wrong pre-filled weight if you had previously logged a light first set manually.",
  },
  {
    area: "Session navigation",
    text: "A back arrow now sits top-left in both guided and list views — tap it to go home without quitting; your session waits for you. Jumping to an exercise from list view lands on the next working set instead of warping back to the warmup.",
  },
  {
    area: "No more 'oops' modal",
    text: "Unfinished sessions resume automatically — no confirmation popup. A session only ends when you tap End Session and confirm, or Record it.",
  },
  {
    area: "Weight nudges",
    text: "Between sets the app suggests going up or down based on your reps and RIR — tap the chip to apply it, or ignore it. The suggestion gently pulses so the 'tap' hint is easy to spot without being loud.",
  },
  {
    area: "Social",
    text: "Social stats are here! See who's training live, global activity, peak gym hours, and how your weekly volume compares to everyone else.",
  },
  {
    area: "Guided session",
    text: "Navigate forward and back between sets with the arrow button. Switching to list view and back now resumes exactly where you left off — no more teleporting to the first exercise.",
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
    text: "Progress bar now drains instead of filling — time remaining at a glance. Tapping 'Skip Rest' triggers a full-screen flash so you always know it registered. Notifications no longer double-fire; only the in-app beep plays when the app is open. Warmup sets show a Done button mid-countdown so you can log them without waiting.",
  },
  {
    area: "Stats",
    text: "New per-exercise Stats page — tap any exercise in Load up (or open Stats from the home screen) to see your strength over time. Each session shows your actual max weight (solid dot) alongside the estimated 1RM (lighter dot), and when you're ready to load up the target weight appears as a dashed line plus a projected trend.",
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
    area: "Load up",
    text: "Load up exercises are now tappable and link directly to their stats page. Tap the northeast arrow to browse all exercises.",
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
