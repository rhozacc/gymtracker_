"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/plan", label: "Plan" },
  { href: "/history", label: "Log" },
  { href: "/charts", label: "Trends" },
  { href: "/me", label: "Me" },
];

function BeamSweep({ onDone }: { onDone: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[200] pointer-events-none"
      onAnimationEnd={onDone}
      style={{ animation: "beam-sweep 400ms ease-in-out forwards" }}
    >
      {/* The beam band — accent gradient that sweeps upward */}
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

export function Nav() {
  const pathname = usePathname();
  const [beam, setBeam] = useState(false);

  const handleTap = useCallback(
    (href: string) => {
      const isAlreadyActive =
        href === "/" ? pathname === "/" : pathname.startsWith(href);
      if (!isAlreadyActive) setBeam(true);
    },
    [pathname]
  );

  return (
    <>
      {beam && <BeamSweep onDone={() => setBeam(false)} />}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border/50">
        <div className="flex items-stretch h-12 max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
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
                className="flex-1 flex flex-col items-center justify-center relative"
              >
                {/* Active dot — like a status LED */}
                <span
                  className={`w-1 h-1 rounded-full mb-1 transition-all duration-200 ${
                    active ? "bg-accent nav-icon-glow" : "bg-transparent"
                  }`}
                />
                <span
                  className={`transition-all duration-200 ${
                    active
                      ? "text-[13px] text-accent font-bold tracking-wide"
                      : "text-[11px] text-muted tracking-wide"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
