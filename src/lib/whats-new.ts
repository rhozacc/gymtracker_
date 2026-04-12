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
    area: "Accent colors",
    text: "Pick your color. Three neons for dark mode, three bold tones for light — each theme keeps its own. Change anytime in Settings or during onboarding.",
  },
  {
    area: "Laser transitions",
    text: "Switching theme or accent fires a neon laser sweep across the screen. The laser color matches whatever you just picked.",
  },
  {
    area: "Rest timer",
    text: "Cooldown bar now fills up instead of draining. No more phantom 30-second rest after warmup sets.",
  },
  {
    area: "Home",
    text: "Loading screen with animated circles while your session history syncs — no more flash of the default day selection.",
  },
];
