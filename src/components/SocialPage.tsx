"use client";

import Link from "next/link";
import { CommunityScreen } from "@/components/social/CommunityScreen";
import { PeakHoursScreen } from "@/components/social/PeakHoursScreen";
import { LiveScreen } from "@/components/social/LiveScreen";
import { YouVsAllScreen } from "@/components/social/YouVsAllScreen";

export function SocialPage() {
  return (
    <div className="space-y-14 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-muted hover:text-text transition-colors"
          aria-label="Back to home"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4L6 9l5 5" />
          </svg>
        </Link>
        <h1 className="text-lg font-medium">Social</h1>
      </div>

      {/* Community */}
      <div>
        <h2 className="text-lg font-medium mb-3">Community</h2>
        <CommunityScreen />
      </div>

      {/* Peak Hours */}
      <div>
        <h2 className="text-lg font-medium mb-3">Peak Hours</h2>
        <PeakHoursScreen />
      </div>

      {/* Live */}
      <div>
        <h2 className="text-lg font-medium mb-3">Live</h2>
        <LiveScreen />
      </div>

      {/* You vs Everyone */}
      <div>
        <h2 className="text-lg font-medium mb-3">You vs Everyone</h2>
        <YouVsAllScreen />
      </div>
    </div>
  );
}
