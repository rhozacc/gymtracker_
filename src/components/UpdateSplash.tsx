"use client";

import { useEffect, useState } from "react";

const VERSION_KEY = "gym-version";
const CURRENT_VERSION =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev";

export function UpdateSplash() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored === CURRENT_VERSION) return;
    // First-ever load: store silently without splash
    if (!stored) {
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      return;
    }
    // Real update — show splash
    setShow(true);
    const t1 = setTimeout(() => setPhase("hold"), 400);
    const t2 = setTimeout(() => setPhase("out"), 1600);
    const t3 = setTimeout(() => {
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      setShow(false);
    }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "#0a0a0a",
        opacity: phase === "out" ? 0 : 1,
        transition: phase === "out" ? "opacity 0.5s ease-in" : "none",
      }}
      onClick={() => {
        setPhase("out");
        setTimeout(() => {
          localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
          setShow(false);
        }, 500);
      }}
    >
      {/* Radial burst */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at center, #39ff1430 0%, transparent 70%)",
          animation: "splash-burst 0.6s ease-out forwards",
        }}
      />

      {/* Zap bolts radiating out */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <svg
          key={deg}
          width="40" height="40"
          viewBox="0 0 24 24"
          fill="var(--color-accent)"
          className="absolute"
          style={{
            top: "50%", left: "50%",
            transformOrigin: "0 0",
            animation: `splash-zap 0.7s cubic-bezier(0.2, 0, 0.4, 1) ${deg * 0.8}ms forwards`,
            transform: `rotate(${deg}deg) translateX(60px) translate(-50%, -50%)`,
            opacity: 0,
          }}
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ))}

      {/* Main text */}
      <div
        className="relative z-10 text-center"
        style={{ animation: "splash-text 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both" }}
      >
        <div
          className="text-5xl font-bold tracking-tighter mb-2"
          style={{ color: "var(--color-accent)", letterSpacing: "-0.03em" }}
        >
          UPDATED
        </div>
        <div className="text-muted text-xs tracking-widest uppercase">
          v{CURRENT_VERSION}
        </div>
      </div>

      {/* Horizontal scan line */}
      <div
        className="absolute w-full h-px"
        style={{
          background: "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
          animation: "splash-scan 0.6s ease-out 0.1s both",
        }}
      />

      <p className="absolute bottom-12 text-muted text-xs" style={{ animation: "splash-text 0.4s ease 0.8s both" }}>
        tap to continue
      </p>
    </div>
  );
}

export { CURRENT_VERSION };
