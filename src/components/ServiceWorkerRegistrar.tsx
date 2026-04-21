"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Snapshot whether a SW is already controlling this page.
    // If not, this is first install — skip the reload to avoid a boot loop.
    const hadController = !!navigator.serviceWorker.controller;

    function onControllerChange() {
      if (!hadController) return;
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Proactively check for a new SW each time the app opens
        reg.update().catch(() => {});
      })
      .catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
