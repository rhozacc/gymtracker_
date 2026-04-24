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
    area: "Blended sessions",
    text: "Hit the gym with a friend. Create a code or scan theirs — two plans merge into one shared workout. Same exercises, your own weights.",
  },
  {
    area: "QR handshake",
    text: "Point their camera at your code. If they're in the app they can scan yours too. Either way, you're in.",
  },
  {
    area: "Shake it up",
    text: "Don't love the blended plan? Tap Shake to reshuffle before starting. New mixes are history-aware — exercises neither of you has touched won't sneak in.",
  },
  {
    area: "Live side-by-side",
    text: "During a blended session, see both of your progress bars stretch across the screen — who's ahead, who's on which lift, all updated live.",
  },
];
