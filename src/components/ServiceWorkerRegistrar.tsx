"use client";

import { useEffect, useState, useCallback } from "react";

const VERSION_KEY = "gym-sw-version";

export function ServiceWorkerRegistrar() {
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const dismiss = useCallback(() => setUpdateMsg(null), []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Listen for messages from the service worker
    function onSWMessage(event: MessageEvent) {
      const { type, version } = event.data || {};
      if (type === "SW_UPDATED" || type === "SW_VERSION") {
        const prev = localStorage.getItem(VERSION_KEY);
        if (prev && prev !== version) {
          setUpdateMsg(`Updated to v${version}`);
        }
        localStorage.setItem(VERSION_KEY, version);
      }
    }

    navigator.serviceWorker.addEventListener("message", onSWMessage);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Check for updates every time the app is opened
        reg.update().catch(() => {});

        // When a new SW is installed and waiting, tell it to activate now
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "GET_VERSION" });
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            // New SW is active — ask it for its version
            if (newWorker.state === "activated") {
              newWorker.postMessage({ type: "GET_VERSION" });
            }
          });
        });

        // If already active, ask for version on first load (stores it for next comparison)
        if (reg.active) {
          reg.active.postMessage({ type: "GET_VERSION" });
        }
      })
      .catch(() => {
        // SW registration failed — degrade gracefully
      });

    return () => {
      navigator.serviceWorker.removeEventListener("message", onSWMessage);
    };
  }, []);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (!updateMsg) return;
    const t = setTimeout(dismiss, 3000);
    return () => clearTimeout(t);
  }, [updateMsg, dismiss]);

  if (!updateMsg) return null;

  return (
    <div
      onClick={dismiss}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-accent text-bg text-sm font-medium px-5 py-3 rounded shadow-lg animate-[fadeIn_100ms_ease-out] cursor-pointer"
    >
      {updateMsg}
    </div>
  );
}
