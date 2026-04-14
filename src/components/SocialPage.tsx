"use client";

import { useRef, useState, useCallback } from "react";
import { CommunityScreen } from "@/components/social/CommunityScreen";
import { PeakHoursScreen } from "@/components/social/PeakHoursScreen";
import { LiveScreen } from "@/components/social/LiveScreen";
import { YouVsAllScreen } from "@/components/social/YouVsAllScreen";

const SCREENS = ["Community", "Peak Hours", "Live", "You vs All"];

export function SocialPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIdx(idx);
  }, []);

  function scrollTo(idx: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      {/* Tab pills */}
      <div className="flex gap-1.5 px-4 pt-4 pb-2 shrink-0">
        {SCREENS.map((label, i) => (
          <button
            key={label}
            onClick={() => scrollTo(i)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-all duration-200 ${
              activeIdx === i
                ? "bg-accent/10 text-accent"
                : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex flex-1 overflow-x-scroll overflow-y-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        <div className="snap-start shrink-0 w-full overflow-y-auto">
          <CommunityScreen />
        </div>
        <div className="snap-start shrink-0 w-full overflow-y-auto">
          <PeakHoursScreen />
        </div>
        <div className="snap-start shrink-0 w-full overflow-y-auto">
          <LiveScreen />
        </div>
        <div className="snap-start shrink-0 w-full overflow-y-auto">
          <YouVsAllScreen />
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 py-3 shrink-0 mb-20">
        {SCREENS.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={`rounded-full transition-all duration-300 ${
              activeIdx === i
                ? "w-4 h-[5px] bg-accent"
                : "w-[5px] h-[5px] bg-muted opacity-40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
