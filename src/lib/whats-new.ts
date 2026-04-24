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
    area: "Blend handshake",
    text: "No codes, no QR, no typing. Agree on any 3 icons with your friend, both tap them here in the same order — you're paired.",
  },
  {
    area: "Same workout, own weights",
    text: "Your plans merge into one shared session. Each of you sees the same exercises but tracks your own loads.",
  },
  {
    area: "Shake it up",
    text: "Don't love the mix? Tap Shake to reshuffle before starting. History-aware — no random exercises neither of you has touched.",
  },
];
