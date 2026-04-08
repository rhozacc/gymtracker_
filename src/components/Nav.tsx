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

export function Nav() {
  const pathname = usePathname();
  const [beam, setBeam] = useState(false);

  const handleTap = useCallback(
    (href: string) => {
      const isActive =
        href === "/" ? pathname === "/" : pathname.startsWith(href);
      if (!isActive) setBeam(true);
    },
    [pathname]
  );

  return (
    <>
      {beam && <BeamSweep onDone={() => setBeam(false)} />}
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
                className={`flex items-center justify-center rounded-full transition-all duration-300 ease-out ${
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
