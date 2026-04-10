"use client";

import { useEffect } from "react";

const ORIENT_LOCK_KEY = "gym-orientation-lock";

export function OrientationLockInit() {
  useEffect(() => {
    if (localStorage.getItem(ORIENT_LOCK_KEY) !== "1") return;
    if (!("orientation" in screen)) return;
    const orient = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
    };
    if (typeof orient.lock !== "function") return;
    orient.lock("portrait").catch(() => {});
  }, []);

  return null;
}
