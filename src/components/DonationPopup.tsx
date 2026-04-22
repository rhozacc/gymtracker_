"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { COLOR_PAIRS } from "@/lib/useTheme";
import { useTheme } from "@/lib/useTheme";

const DISMISS_KEY = "gym-donation-dismiss";
const SESSION_COUNT_KEY = "gym-session-count";
const UNLOCKED_COLORS_CACHE_KEY = "gym-unlocked-colors";
const DISMISS_DAYS = 21;
const SESSION_THRESHOLD = 3;
const LOCKED_PAIRS = COLOR_PAIRS.filter((p) => p.key !== "green");

const MESSAGES = [
  {
    heading: "Buy me a protein shake?",
    body: "gymtracker_ is free. Pick a palette, $2.99 unlocks it.",
  },
  {
    heading: "Fuel the grind?",
    body: "Building this takes time. Pick a color and support for a shake's worth.",
  },
  {
    heading: "Keep the gains going?",
    body: "No subscriptions, no ads. Pick a color to unlock for $2.99.",
  },
  {
    heading: "Support the build?",
    body: "Pick a palette below — $2.99 unlocks it permanently.",
  },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DonationPopup() {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const msgIndex = useMemo(() => Math.floor(Math.random() * MESSAGES.length), []);
  const msg = MESSAGES[msgIndex];

  const { data } = useSWR<{ id: string; unlockedColors: string[] }>("/api/me", fetcher, {
    onSuccess(d) {
      if (d?.unlockedColors) {
        localStorage.setItem(UNLOCKED_COLORS_CACHE_KEY, JSON.stringify(d.unlockedColors));
      }
    },
  });

  const unlockedColors: string[] = useMemo(() => {
    if (data?.unlockedColors) return data.unlockedColors;
    try {
      return JSON.parse(localStorage.getItem(UNLOCKED_COLORS_CACHE_KEY) ?? "[]");
    } catch {
      return [];
    }
  }, [data]);

  const userId = data?.id ?? null;

  const availablePairs = LOCKED_PAIRS.filter((p) => !unlockedColors.includes(p.key));
  const selectedPair = availablePairs.find((p) => p.key === selectedKey) ?? null;

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_DONATION_URL) return;

    const sessionCount = parseInt(localStorage.getItem(SESSION_COUNT_KEY) ?? "0", 10);
    if (sessionCount < SESSION_THRESHOLD) return;
    if (unlockedColors.length >= 3) return;

    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw) {
      const dismissed = parseInt(raw, 10);
      const daysSince = (Date.now() - dismissed) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    setVisible(true);
  }, [unlockedColors]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  function handleBuy() {
    if (!selectedPair || !userId) return;
    const base = process.env.NEXT_PUBLIC_DONATION_URL!;
    const url = `${base}?client_reference_id=${userId}:${selectedPair.key}`;
    window.open(url, "_blank");
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      setVisible(false);
    }, 2000);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-[var(--color-bg)]/80 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 max-w-xs w-full mx-4">
        {confirmed ? (
          <p className="text-sm text-[var(--color-text)] text-center py-4">
            Payment opened — color unlocks once confirmed.
          </p>
        ) : (
          <>
            <h2 className="text-sm font-medium text-[var(--color-text)] text-center">
              {msg.heading}
            </h2>
            <p className="text-xs text-[var(--color-muted)] text-center mt-1">{msg.body}</p>

            <div className="flex gap-3 justify-center my-5">
              {availablePairs.map((pair) => {
                const color = theme === "dark" ? pair.dark.value : pair.light.value;
                const isSelected = selectedKey === pair.key;
                return (
                  <button
                    key={pair.key}
                    onClick={() => setSelectedKey(isSelected ? null : pair.key)}
                    title={pair.name}
                    style={{ backgroundColor: color }}
                    className={[
                      "w-9 h-9 rounded-full transition-all duration-150",
                      isSelected
                        ? "ring-2 ring-offset-2 ring-offset-[var(--color-surface)] ring-[var(--color-accent)] scale-110"
                        : "opacity-70 hover:opacity-100",
                    ].join(" ")}
                  />
                );
              })}
            </div>

            <button
              onClick={handleBuy}
              disabled={!selectedPair || !userId}
              className={[
                "bg-[var(--color-accent)] text-[var(--color-bg)] font-medium rounded h-12 w-full text-sm transition-opacity",
                !selectedPair || !userId ? "opacity-40 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {selectedPair ? `Unlock ${selectedPair.name} — $2.99` : "Pick a color above"}
            </button>

            <button
              onClick={dismiss}
              className="text-[var(--color-muted)] text-sm w-full py-3 mt-1"
            >
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>
  );
}
