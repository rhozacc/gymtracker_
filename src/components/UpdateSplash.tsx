"use client";

import { useEffect, useState } from "react";
import { WHATS_NEW } from "@/lib/whats-new";
import type { WhatsNewEntry } from "@/lib/whats-new";

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

type Phase = "circles" | "expanding" | "whats-new";

export function UpdateSplash() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<Phase>("circles");

  useEffect(() => {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored === CURRENT_VERSION) return;
    if (!stored) { localStorage.setItem(VERSION_KEY, CURRENT_VERSION); return; }

    setShow(true);
    // After circles finish, trigger the square expansion
    const t1 = setTimeout(() => setPhase("expanding"), 2500);
    // After expansion, show the what's new panel
    const t2 = setTimeout(() => setPhase("whats-new"), 3100);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function dismiss() {
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden flex items-center justify-center"
      style={{ background: "var(--color-bg)" }}
    >
      {/* ── Phase 1: circles + label ── */}
      {phase === "circles" && (
        <>
          {CIRCLES.map(([cx, cy, size, delay], i) => (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
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
            className="relative z-10 text-text font-bold text-2xl tracking-tight pointer-events-none"
            style={{ animation: "uc-text 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both" }}
          >
            Updating App
          </p>
        </>
      )}

      {/* ── Phase 2: square expands from center ── */}
      {(phase === "expanding" || phase === "whats-new") && (
        <div
          className="absolute"
          style={{
            background: "var(--color-surface)",
            borderRadius: phase === "whats-new" ? "0" : "12px",
            animation: phase === "expanding"
              ? "uc-square 0.55s cubic-bezier(0.4, 0, 0.2, 1) forwards"
              : "none",
            inset: phase === "whats-new" ? "0" : undefined,
            width: phase === "expanding" ? "80px" : undefined,
            height: phase === "expanding" ? "80px" : undefined,
          }}
        />
      )}

      {/* ── Phase 3: what's new content ── */}
      {phase === "whats-new" && (
        <div
          className="fixed inset-0 z-10 flex flex-col px-8 pt-20 pb-16"
          style={{
            background: "var(--color-surface)",
            animation: "uc-text 0.35s ease-out both",
          }}
          onClick={dismiss}
        >
          <div className="flex-1 flex flex-col justify-center gap-8 max-w-sm mx-auto w-full">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-3">
                What&apos;s new · v{CURRENT_VERSION}
              </p>
              <h2 className="text-3xl font-bold text-text tracking-tight leading-tight">
                Just updated.
              </h2>
            </div>

            <div className="space-y-5">
              {WHATS_NEW.map((item: WhatsNewEntry, i: number) => (
                <div key={i}>
                  <h2 className="text-accent font-bold text-base leading-snug">{item.area}</h2>
                  <p className="text-text text-sm leading-relaxed mt-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-sm mx-auto w-full">
            <p className="text-muted text-xs text-center">tap anywhere to continue</p>
          </div>
        </div>
      )}
    </div>
  );
}

export { CURRENT_VERSION };
