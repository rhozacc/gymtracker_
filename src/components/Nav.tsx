"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useNavVisibility } from "@/lib/useNavVisibility";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/plan", label: "Plan" },
  { href: "/history", label: "Log" },
  { href: "/charts", label: "Trends" },
  { href: "/social", label: "Social" },
];

function BeamSweep({ onDone }: { onDone: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[200] pointer-events-none"
      onAnimationEnd={onDone}
      style={{ animation: "beam-sweep 400ms ease-in-out forwards" }}
    >
      <div
        className="absolute left-0 right-0 h-full"
        style={{
          background: `linear-gradient(to top, transparent 0%, var(--color-accent) 49%, var(--color-accent) 51%, transparent 100%)`,
          opacity: 0.12,
        }}
      />
    </div>,
    document.body
  );
}

function useSwipeNav() {
  const pathname = usePathname();
  const router = useRouter();
  const anchorX = useRef(0);
  const touchStartY = useRef(0);
  const currentIdx = useRef(0);
  const swiping = useRef(false);
  const [beam, setBeam] = useState(false);

  const getCurrentIndex = useCallback(() => {
    for (let i = 0; i < tabs.length; i++) {
      const t = tabs[i];
      if (t.href === "/" ? pathname === "/" : pathname.startsWith(t.href)) return i;
    }
    return 0;
  }, [pathname]);

  useEffect(() => {
    const THRESHOLD = 50;

    function onTouchStart(e: TouchEvent) {
      anchorX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      currentIdx.current = getCurrentIndex();
      swiping.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      const dx = e.touches[0].clientX - anchorX.current;
      const dy = e.touches[0].clientY - touchStartY.current;

      // Lock to horizontal after initial movement
      if (!swiping.current) {
        if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
        swiping.current = Math.abs(dx) > Math.abs(dy);
        if (!swiping.current) return;
      }

      // Continuous: each time we cross the threshold, advance one tab
      if (Math.abs(dx) >= THRESHOLD) {
        // Swipe right (positive dx) → go to next tab (higher index)
        const next = dx > 0 ? currentIdx.current + 1 : currentIdx.current - 1;
        if (next >= 0 && next < tabs.length && next !== currentIdx.current) {
          currentIdx.current = next;
          setBeam(true);
          router.push(tabs[next].href);
        }
        // Reset anchor so the next threshold-crossing advances again
        anchorX.current = e.touches[0].clientX;
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, [getCurrentIndex, router]);

  return { beam, clearBeam: () => setBeam(false) };
}

export function Nav() {
  const pathname = usePathname();
  const { navVisible } = useNavVisibility();
  const [tapBeam, setTapBeam] = useState(false);
  const { beam: swipeBeam, clearBeam } = useSwipeNav();

  const handleTap = useCallback(
    (href: string) => {
      const isActive =
        href === "/" ? pathname === "/" : pathname.startsWith(href);
      if (!isActive) setTapBeam(true);
    },
    [pathname]
  );

  const showBeam = tapBeam || swipeBeam;

  if (!navVisible) return null;

  return (
    <>
      {showBeam && (
        <BeamSweep
          onDone={() => {
            setTapBeam(false);
            clearBeam();
          }}
        />
      )}
      {/* Glow effect behind navbar */}
      <div
        className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-40"
        style={{
          background: "radial-gradient(ellipse at center bottom, var(--color-accent) 0%, transparent 70%)",
          opacity: 0.08,
        }}
      />
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center bg-surface border border-border rounded-full p-1.5 gap-0.5 shadow-lg shadow-black/10">
          {tabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => handleTap(tab.href)}
                className={`flex items-center justify-center rounded-full transition-all duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${
                  active
                    ? "h-9 px-4 bg-accent/10"
                    : "w-10 h-10"
                }`}
              >
                {active ? (
                  <span className="text-accent text-[13px] font-semibold whitespace-nowrap">
                    {tab.label}
                  </span>
                ) : (
                  <span className="w-[5px] h-[5px] rounded-full bg-muted" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
