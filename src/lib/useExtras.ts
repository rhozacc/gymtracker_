"use client";

import { useState, useCallback, useMemo } from "react";
import {
  type ExtrasSelection,
  type ExtraCategory,
  type ExtraOption,
  DEFAULT_SELECTION,
  getSelectedExtras,
} from "./extras";

const STORAGE_KEY = "gym-extras";

function getStoredSelection(): ExtrasSelection {
  if (typeof window === "undefined") return DEFAULT_SELECTION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SELECTION;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SELECTION, ...parsed };
  } catch {
    return DEFAULT_SELECTION;
  }
}

export function useExtras() {
  const [selection, setSelection] = useState<ExtrasSelection>(getStoredSelection);

  const setExtra = useCallback((category: ExtraCategory, optionId: string | null) => {
    setSelection((prev) => {
      const next = { ...prev, [category]: optionId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const selectedExtras: ExtraOption[] = useMemo(
    () => getSelectedExtras(selection),
    [selection]
  );

  return { selection, setExtra, selectedExtras };
}
