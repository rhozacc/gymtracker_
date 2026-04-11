"use client";

import { useMemo } from "react";
import type { ExtraOption, ExtraCategory } from "@/lib/extras";

// Casual opening lines per category
const OPENERS: Record<ExtraCategory, string[]> = {
  abs:     ["how about a", "up for a", "tag on a quick", "finish with a"],
  cardio:  ["finish with a", "how about a", "round it off with a", "one more —"],
  stretch: ["before you go —", "take a few mins for a", "close it out with a", "how about a"],
};

interface ExtrasSuggestionProps {
  suggestion: ExtraOption;
  onAccept: () => void;
  onSkip: () => void;
}

export function ExtrasSuggestion({ suggestion, onAccept, onSkip }: ExtrasSuggestionProps) {
  const opener = useMemo(() => {
    const list = OPENERS[suggestion.category];
    // deterministic pick based on routine id to avoid hydration flicker
    const idx = suggestion.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % list.length;
    return list[idx];
  }, [suggestion]);

  return (
    <div className="fixed inset-0 z-[200] bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">

        {/* Category pill */}
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted border border-border rounded-full px-3 py-1">
          {suggestion.category}
        </span>

        {/* Suggestion text */}
        <div>
          <p className="text-muted text-base">{opener}</p>
          <h2 className="text-3xl font-bold mt-0.5 leading-tight">
            {suggestion.name.toLowerCase()}?
          </h2>
          <p className="text-muted text-sm mt-2 max-w-[260px] mx-auto">
            {suggestion.duration} &mdash; {suggestion.description}
          </p>
        </div>

        {/* Actions */}
        <div className="w-full space-y-3">
          <button
            onClick={onAccept}
            className="w-full h-14 bg-accent text-bg font-medium rounded-lg text-base hover:opacity-90 transition-opacity"
          >
            yeah, let&apos;s go
          </button>
          <button
            onClick={onSkip}
            className="w-full text-muted text-sm hover:text-text transition-colors py-2"
          >
            not today
          </button>
        </div>

      </div>
    </div>
  );
}
