"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/plan", label: "Plan" },
  { href: "/history", label: "Log" },
  { href: "/charts", label: "Charts" },
  { href: "/me", label: "Me" },
];

function Flash({ onDone }: { onDone: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[200] pointer-events-none bg-accent"
      style={{ animation: "nav-flash 250ms ease-out forwards" }}
      onAnimationEnd={onDone}
    />,
    document.body
  );
}

export function Nav() {
  const pathname = usePathname();
  const [flash, setFlash] = useState(false);

  const handleTap = useCallback(
    (href: string) => {
      const isAlreadyActive =
        href === "/" ? pathname === "/" : pathname.startsWith(href);
      if (!isAlreadyActive) setFlash(true);
    },
    [pathname]
  );

  return (
    <>
      {flash && <Flash onDone={() => setFlash(false)} />}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-t border-border/50">
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
                className="flex-1 flex items-center justify-center relative"
              >
                <span
                  className={`text-[13px] tracking-wide transition-colors duration-150 ${
                    active
                      ? "text-accent font-semibold"
                      : "text-muted"
                  }`}
                >
                  {tab.label}
                </span>
                {/* Active underline */}
                <span
                  className={`absolute bottom-0 h-[2px] rounded-full transition-all duration-200 ${
                    active
                      ? "w-6 bg-accent"
                      : "w-0 bg-transparent"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
