"use client";

import Link from "next/link";
import { ExtrasPicker } from "@/components/ExtrasPicker";
import { useExtras } from "@/lib/useExtras";

export default function ExtrasPage() {
  const { selectedExtras } = useExtras();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium">Session Extras</h1>
        <p className="text-muted text-xs mt-1">
          Add-ons that run after your main workout. Pick one per category or skip.
        </p>
      </div>

      {/* Main / Extras toggle */}
      <div className="flex gap-1 border border-border rounded-lg p-1">
        <Link
          href="/plan"
          className="flex-1 text-xs py-2 rounded-md text-center text-muted hover:text-foreground transition-colors"
        >
          Main
        </Link>
        <div className="flex-1 text-xs py-2 rounded-md text-center bg-surface text-accent font-medium">
          Extras
        </div>
      </div>

      <ExtrasPicker />

      {/* Summary */}
      {selectedExtras.length > 0 && (
        <div className="border-t border-border pt-4">
          <div className="text-xs text-muted mb-2">Active extras</div>
          <div className="flex flex-wrap gap-2">
            {selectedExtras.map((ext) => (
              <span
                key={ext.id}
                className="text-[10px] text-accent border border-accent/40 bg-accent/10 rounded-full px-2 py-0.5"
              >
                {ext.name} · {ext.duration}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
