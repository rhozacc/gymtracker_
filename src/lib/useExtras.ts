"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "./swr";
import {
  type ExtrasSelection,
  type ExtraCategory,
  type ExtraOption,
  DEFAULT_SELECTION,
  getSelectedExtras,
} from "./extras";

export function useExtras() {
  const { data, mutate } = useSWR<ExtrasSelection>("/api/extras", fetcher);

  const selection: ExtrasSelection = data ?? DEFAULT_SELECTION;

  const setExtra = useCallback(
    async (category: ExtraCategory, optionId: string | null) => {
      const next = { ...selection, [category]: optionId };
      // Optimistic update
      mutate(next, false);
      await fetch("/api/extras", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      mutate();
    },
    [selection, mutate]
  );

  const selectedExtras: ExtraOption[] = useMemo(
    () => getSelectedExtras(selection),
    [selection]
  );

  return { selection, setExtra, selectedExtras };
}
