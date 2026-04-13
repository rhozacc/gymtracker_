/**
 * localStorage helpers — typed JSON read/write with graceful fallbacks.
 * Use these instead of raw localStorage.getItem/JSON.parse to avoid
 * scattered try/catch boilerplate throughout the app.
 */

export function getJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — non-critical
  }
}
