"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ sw = 1.5 }: { sw?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z" />
    </svg>
  );
}

function PlanIcon({ sw = 1.5 }: { sw?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function HistoryIcon({ sw = 1.5 }: { sw?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  );
}

function ChartsIcon({ sw = 1.5 }: { sw?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function MeIcon({ sw = 1.5 }: { sw?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
    </svg>
  );
}

const tabs = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/plan", label: "Plan", Icon: PlanIcon },
  { href: "/history", label: "History", Icon: HistoryIcon },
  { href: "/charts", label: "Charts", Icon: ChartsIcon },
  { href: "/me", label: "Me", Icon: MeIcon },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-t border-border/50">
      <div className="flex items-center h-16 max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center h-full gap-1 relative ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              {/* Pill indicator */}
              <span
                className={`absolute top-1.5 w-5 h-[3px] rounded-full transition-all duration-200 ${
                  active
                    ? "bg-accent opacity-100 scale-x-100"
                    : "bg-transparent opacity-0 scale-x-0"
                }`}
              />
              {/* Icon */}
              <span
                className={`transition-transform duration-200 ease-out ${
                  active ? "scale-110 nav-icon-glow" : ""
                }`}
              >
                <tab.Icon sw={active ? 2 : 1.5} />
              </span>
              {/* Label */}
              <span
                className={`text-[11px] uppercase tracking-wide leading-none ${
                  active ? "font-medium" : ""
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
