"use client";

import { useState, useEffect, useRef, useCallback, type RefObject, type MutableRefObject } from "react";

const DAY_ORDER_KEY = (planId: string) => `gym-day-order-${planId}`;

function validateDayOrder(order: string[], defaultKeys: string[]): string[] | null {
  if (
    order.length === defaultKeys.length &&
    defaultKeys.every((k) => order.includes(k))
  ) {
    return order;
  }
  return null;
}

function getSavedDayOrder(
  planId: string,
  defaultKeys: string[],
  dbDayOrder?: Record<string, string[]>
): string[] {
  if (dbDayOrder && dbDayOrder[planId]) {
    const valid = validateDayOrder(dbDayOrder[planId], defaultKeys);
    if (valid) return valid;
  }
  if (typeof window === "undefined") return defaultKeys;
  try {
    const saved = localStorage.getItem(DAY_ORDER_KEY(planId));
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      const valid = validateDayOrder(parsed, defaultKeys);
      if (valid) return valid;
    }
  } catch {}
  return defaultKeys;
}

interface Prefs {
  dayOrder?: Record<string, string[]>;
}

interface UseDragReorderDaysOptions {
  planId: string;
  defaultKeys: string[];
  prefs: Prefs | undefined;
  mutatePrefs: (data: Prefs, revalidate: boolean) => void;
}

interface UseDragReorderDaysReturn {
  dayKeys: string[];
  setDayKeys: (keys: string[]) => void;
  dragIdx: number | null;
  overIdx: number | null;
  displayKeys: string[];
  gridRef: RefObject<HTMLDivElement>;
  cardRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  handleTouchStart: (idx: number, e: { touches: { clientY: number }[] }) => void;
  handleMouseDown: (idx: number, e: { button: number; clientY: number }) => void;
  finishDrag: () => void;
}

export function useDragReorderDays({
  planId,
  defaultKeys,
  prefs,
  mutatePrefs,
}: UseDragReorderDaysOptions): UseDragReorderDaysReturn {
  const [dayKeys, setDayKeysState] = useState<string[]>(() =>
    getSavedDayOrder(planId, defaultKeys)
  );
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragIdxRef = useRef<number | null>(null);
  const overIdxRef = useRef<number | null>(null);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => {
    setDayKeysState(
      getSavedDayOrder(
        planId,
        defaultKeys,
        prefs?.dayOrder as Record<string, string[]> | undefined
      )
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, prefs]);

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  function startDrag(idx: number) {
    isDraggingRef.current = true;
    dragIdxRef.current = idx;
    overIdxRef.current = idx;
    setDragIdx(idx);
    setOverIdx(idx);
    if (navigator.vibrate) navigator.vibrate(30);
  }

  function finishDrag() {
    clearHold();
    const d = dragIdxRef.current;
    const o = overIdxRef.current;
    if (d !== null && o !== null && d !== o) {
      setDayKeysState((prev) => {
        const newKeys = [...prev];
        const [removed] = newKeys.splice(d, 1);
        newKeys.splice(o, 0, removed);
        localStorage.setItem(DAY_ORDER_KEY(planId), JSON.stringify(newKeys));
        const updatedDayOrder = {
          ...((prefsRef.current?.dayOrder as Record<string, string[]>) || {}),
          [planId]: newKeys,
        };
        fetch("/api/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dayOrder: updatedDayOrder }),
        });
        mutatePrefs({ ...prefsRef.current, dayOrder: updatedDayOrder }, false);
        return newKeys;
      });
    }
    isDraggingRef.current = false;
    dragIdxRef.current = null;
    overIdxRef.current = null;
    setDragIdx(null);
    setOverIdx(null);
  }

  function handleTouchStart(idx: number, e: { touches: { clientY: number }[] }) {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    clearHold();
    holdTimerRef.current = setTimeout(() => startDrag(idx), 400);
  }

  function handleMouseDown(idx: number, e: { button: number; clientY: number }) {
    if (e.button !== 0) return;
    touchStartY.current = e.clientY;
    clearHold();
    holdTimerRef.current = setTimeout(() => startDrag(idx), 400);
  }

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!isDraggingRef.current) {
        if (Math.abs(touch.clientY - touchStartY.current) > 10) {
          clearHold();
        }
        return;
      }
      e.preventDefault();
      const y = touch.clientY;
      for (let i = 0; i < cardRefs.current.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) {
          overIdxRef.current = i;
          setOverIdx(i);
          break;
        }
      }
    }

    grid.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => grid.removeEventListener("touchmove", onTouchMove);
  }, [clearHold]);

  const displayKeys = (() => {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) return dayKeys;
    const preview = [...dayKeys];
    const [removed] = preview.splice(dragIdx, 1);
    preview.splice(overIdx, 0, removed);
    return preview;
  })();

  return {
    dayKeys,
    setDayKeys: setDayKeysState,
    dragIdx,
    overIdx,
    displayKeys,
    gridRef,
    cardRefs,
    handleTouchStart,
    handleMouseDown,
    finishDrag,
  };
}
