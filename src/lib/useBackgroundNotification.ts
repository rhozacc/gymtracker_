"use client";

import { useCallback } from "react";

export function useBackgroundNotification() {
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  const notifyIfBackgrounded = useCallback((title: string, body: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (document.visibilityState !== "hidden") return;
    new Notification(title, { body, tag: "gym-timer" });
  }, []);

  return { requestPermission, notifyIfBackgrounded };
}
