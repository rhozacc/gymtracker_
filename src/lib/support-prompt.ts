import { getJson, setJson } from "./storage";

const SESSION_THRESHOLD = 5;
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export const MESSAGES = [
  "Buy me a protein shake",
  "Buy me a coffee",
  "Buy me a pizza slice",
  "Buy me a pre-workout",
  "Keep the lights on",
];

export function incrementSessionCount(): void {
  const count = getJson<number>("gym-support-session-count", 0);
  setJson("gym-support-session-count", count + 1);
}

export function shouldShowSupportPrompt(): boolean {
  const count = getJson<number>("gym-support-session-count", 0);
  const lastShown = getJson<number>("gym-support-last-shown", 0);
  return count > 0 && count % SESSION_THRESHOLD === 0 && Date.now() - lastShown >= COOLDOWN_MS;
}

export function recordSupportPromptShown(): void {
  setJson("gym-support-last-shown", Date.now());
}

export function pickSupportMessage(): string {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}
