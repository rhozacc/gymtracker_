"use client";

import { useState, useCallback, useEffect } from "react";

export type ThemePreference = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

const STORAGE_KEY = "gym-theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "dark"; // default to dark
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const theme: ResolvedTheme = preference === "system" ? systemTheme : preference;

  // Apply resolved theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
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
  }, []);

  return { theme, preference, setTheme, toggleTheme };
}
