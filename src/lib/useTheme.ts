"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export type ThemePreference = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

const STORAGE_KEY = "gym-theme";
const ACCENT_DARK_KEY = "gym-accent-dark";
const ACCENT_LIGHT_KEY = "gym-accent-light";

export const DARK_ACCENTS = [
  { id: "green", name: "Green", value: "#39ff14" },
  { id: "cyan",  name: "Cyan",  value: "#00f5ff" },
  { id: "pink",  name: "Pink",  value: "#ff2d78" },
];

export const LIGHT_ACCENTS = [
  { id: "orange", name: "Orange", value: "#d4622b" },
  { id: "blue",   name: "Blue",   value: "#2563eb" },
  { id: "violet", name: "Violet", value: "#7c3aed" },
];

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

export function triggerColorTransition() {
  if (typeof window === "undefined") return;
  document.documentElement.classList.add("color-transitioning");
  setTimeout(() => document.documentElement.classList.remove("color-transitioning"), 350);
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

  // Apply theme + accent to DOM whenever resolved theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    applyAccentToDom(getStoredAccent(theme));
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
    triggerColorTransition();
    localStorage.setItem(STORAGE_KEY, pref);
    if (pref === "system") setSystemTheme(getSystemTheme());
    setPreferenceState(pref);
  }, []);

  const setAccent = useCallback((color: string, forTheme: ResolvedTheme) => {
    const key = forTheme === "dark" ? ACCENT_DARK_KEY : ACCENT_LIGHT_KEY;
    localStorage.setItem(key, color);
    if (forTheme === "dark") setDarkAccentState(color);
    else setLightAccentState(color);
    if (forTheme === themeRef.current) {
      triggerColorTransition();
      applyAccentToDom(color);
    }
  }, []);

  // Header button: cycle dark → light → system
  const toggleTheme = useCallback(() => {
    triggerColorTransition();
    setPreferenceState((prev) => {
      const next: ThemePreference =
        prev === "dark" ? "light" : prev === "light" ? "system" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      if (next === "system") setSystemTheme(getSystemTheme());
      return next;
    });
  }, []);

  return { theme, preference, accent, darkAccent, lightAccent, setTheme, setAccent, toggleTheme };
}
