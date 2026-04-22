"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export type ThemePreference = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

const STORAGE_KEY = "gym-theme";
const ACCENT_DARK_KEY = "gym-accent-dark";
const ACCENT_LIGHT_KEY = "gym-accent-light";

// Dark: neon accents (named). Light: rich bold (paired 1:1 by family).
export const DARK_ACCENTS = [
  { id: "neon",   name: "Neon",   value: "#39ff14" }, // electric green
  { id: "violet", name: "Violet", value: "#c084fc" }, // soft lavender violet
  { id: "banana", name: "Banana", value: "#fde047" }, // warm banana yellow
  { id: "rose",   name: "Rose",   value: "#fb2d6e" }, // hot rose
];

export const LIGHT_ACCENTS = [
  { id: "jungle",  name: "Jungle",  value: "#15803d" }, // rich dark jungle green
  { id: "magenta", name: "Magenta", value: "#c026d3" }, // vivid magenta
  { id: "orange",  name: "Orange",  value: "#d4622b" }, // burnt orange (OG)
  { id: "terrano", name: "Terrano", value: "#be5a38" }, // deep terracotta
];

export const COLOR_PAIRS = [
  { key: "green",  name: "Green",  dark: DARK_ACCENTS[0], light: LIGHT_ACCENTS[0] },
  { key: "violet", name: "Violet", dark: DARK_ACCENTS[1], light: LIGHT_ACCENTS[1] },
  { key: "warm",   name: "Warm",   dark: DARK_ACCENTS[2], light: LIGHT_ACCENTS[2] },
  { key: "rose",   name: "Rose",   dark: DARK_ACCENTS[3], light: LIGHT_ACCENTS[3] },
] as const;

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "dark";
}

function getStoredAccent(resolvedTheme: ResolvedTheme): string {
  if (typeof window === "undefined") {
    return resolvedTheme === "dark" ? DARK_ACCENTS[0].value : LIGHT_ACCENTS[0].value;
  }
  const key = resolvedTheme === "dark" ? ACCENT_DARK_KEY : ACCENT_LIGHT_KEY;
  const stored = localStorage.getItem(key);
  const defaults = resolvedTheme === "dark" ? DARK_ACCENTS : LIGHT_ACCENTS;
  return stored || defaults[0].value;
}

export function applyAccentToDom(accent: string) {
  document.documentElement.style.setProperty("--color-accent", accent);
  document.documentElement.style.setProperty("--color-chart-bar-1", accent);
  document.documentElement.style.setProperty("--color-chart-line", accent);
}

/** Fire the laser sweep animation. Call AFTER the color change is applied to DOM. */
export function fireLaser() {
  if (typeof window === "undefined") return;
  const el = document.getElementById("gymtracker-laser");
  if (!el) return;
  el.style.animation = "none";
  void el.offsetWidth; // force reflow to reset animation
  el.style.animation = "laser-sweep 320ms cubic-bezier(0.4, 0, 0.2, 1) forwards";
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const theme: ResolvedTheme = preference === "system" ? systemTheme : preference;
  const themeRef = useRef(theme);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  const [darkAccent, setDarkAccentState] = useState<string>(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem(ACCENT_DARK_KEY) || DARK_ACCENTS[0].value)
      : DARK_ACCENTS[0].value
  );
  const [lightAccent, setLightAccentState] = useState<string>(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem(ACCENT_LIGHT_KEY) || LIGHT_ACCENTS[0].value)
      : LIGHT_ACCENTS[0].value
  );

  const accent = theme === "dark" ? darkAccent : lightAccent;

  // Apply theme + accent to DOM. Fire laser only on actual theme *changes* (not initial mount).
  const prevThemeRef = useRef<string | null>(null);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    applyAccentToDom(getStoredAccent(theme));
    if (prevThemeRef.current !== null && prevThemeRef.current !== theme) {
      fireLaser();
    }
    prevThemeRef.current = theme;
  }, [theme]);

  // Track OS preference changes when in system mode
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  const setTheme = useCallback((pref: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, pref);
    if (pref === "system") setSystemTheme(getSystemTheme());
    setPreferenceState(pref);
    // Laser fires from the useEffect above once the new theme is applied to DOM
  }, []);

  const setAccent = useCallback((color: string, forTheme: ResolvedTheme) => {
    const key = forTheme === "dark" ? ACCENT_DARK_KEY : ACCENT_LIGHT_KEY;
    localStorage.setItem(key, color);
    if (forTheme === "dark") setDarkAccentState(color);
    else setLightAccentState(color);
    if (forTheme === themeRef.current) {
      applyAccentToDom(color); // apply first — laser shows new color
      fireLaser();
    }
  }, []);

  // Header button: cycle dark → light → system
  const toggleTheme = useCallback(() => {
    setPreferenceState((prev) => {
      const next: ThemePreference =
        prev === "dark" ? "light" : prev === "light" ? "system" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      if (next === "system") setSystemTheme(getSystemTheme());
      return next;
    });
    // Laser fires from the useEffect above once the new theme is applied to DOM
  }, []);

  return { theme, preference, accent, darkAccent, lightAccent, setTheme, setAccent, toggleTheme };
}
