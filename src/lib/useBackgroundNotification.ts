"use client";

import { useCallback } from "react";

const NOTIF_OPTED_OUT = "gym-notifications-off";

function notificationsEnabled(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  return localStorage.getItem(NOTIF_OPTED_OUT) !== "1";
}

interface NextExerciseInfo {
  name: string;
  weight: string;
  reps: string;
  setNumber: number;
  totalSets: number;
}

async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export function useBackgroundNotification() {
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  /** Show a one-shot notification (used when rest ends while app is backgrounded) */
  const notifyIfBackgrounded = useCallback(async (title: string, body: string) => {
    if (!notificationsEnabled()) return;
    if (document.visibilityState !== "hidden") return;

    // Prefer SW-based notification (works on iOS PWA lock screen)
    const reg = await getSWRegistration();
    if (reg?.active) {
      reg.active.postMessage({ type: "SHOW_NOTIFICATION", payload: { title, body } });
    } else {
      new Notification(title, { body, tag: "gym-timer" });
    }
  }, []);

  /**
   * Start a rest timer in the service worker.
   * Shows a "Resting..." notification immediately on the lock screen,
   * then replaces it with "Rest Complete" when the timer expires.
   * This works even when the app/tab is backgrounded on iOS.
   */
  const startRestTimer = useCallback(async (seconds: number, nextExercise?: NextExerciseInfo) => {
    if (!notificationsEnabled()) return;

    const reg = await getSWRegistration();
    if (reg?.active) {
      reg.active.postMessage({
        type: "START_REST_TIMER",
        payload: { seconds, nextExercise },
      });
    }
  }, []);

  /** Cancel the SW rest timer (e.g. when user skips rest or dismisses early) */
  const cancelRestTimer = useCallback(async () => {
    const reg = await getSWRegistration();
    if (reg?.active) {
      reg.active.postMessage({ type: "CANCEL_REST_TIMER" });
    }
  }, []);

  return { requestPermission, notifyIfBackgrounded, startRestTimer, cancelRestTimer };
}
