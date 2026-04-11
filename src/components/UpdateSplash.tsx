"use client";

import { useEffect, useState } from "react";

const VERSION_KEY = "gym-version";
const CURRENT_VERSION =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev";

// Circles: [cx%, cy%, size vw, delay ms]
const CIRCLES: [number, number, number, number][] = [
  [50,  50,  90,    0],
  [20,  30,  55,  200],
  [78,  22,  45,  350],
  [60,  75,  65,  150],
  [15,  68,  40,  450],
  [82,  60,  50,  280],
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
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[999] overflow-hidden pointer-events-none flex items-center justify-center"
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
            animation: `uc-expand 2s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
          }}
        />
      ))}

      <p
        className="relative z-10 text-text font-bold text-2xl tracking-tight"
        style={{ animation: "uc-text 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both" }}
      >
        Updating App
      </p>
    </div>
  );
}

export { CURRENT_VERSION };
