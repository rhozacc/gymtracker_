"use client";

import { useEffect, useState } from "react";

const VERSION_KEY = "gym-version";
const CURRENT_VERSION =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev";

// Circles: [cx%, cy%, size, delay ms]
const CIRCLES: [number, number, number, number][] = [
  [50,  50,  90,   0],
  [20,  30,  55,  80],
  [78,  22,  45, 120],
  [60,  75,  65,  50],
  [15,  68,  40, 160],
  [82,  60,  50, 100],
];

export function UpdateSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored === CURRENT_VERSION) return;
    if (!stored) { localStorage.setItem(VERSION_KEY, CURRENT_VERSION); return; }
    setShow(true);
    const t = setTimeout(() => {
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      setShow(false);
    }, 1100);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[999] overflow-hidden pointer-events-none"
      style={{ background: "var(--color-bg)" }}
    >
      {CIRCLES.map(([cx, cy, size, delay], i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${cx}%`,
            top: `${cy}%`,
            width: `${size}vw`,
            height: `${size}vw`,
            transform: "translate(-50%, -50%) scale(0)",
            border: "1.5px solid var(--color-accent)",
            animation: `uc-expand 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
          }}
        />
      ))}
    </div>
  );
}

export { CURRENT_VERSION };
