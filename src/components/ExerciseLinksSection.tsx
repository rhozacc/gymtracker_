"use client";

import { useState, useMemo, useRef } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/lib/swr";
import { getAllExercises } from "@/lib/program";
import { getExerciseLink } from "@/lib/exerciseLinks";
import { authClient } from "@/lib/auth-client";

const API_KEY = "/api/exercise-links";
const BASE = "https://www.muscleandstrength.com/exercises/";

type Phase = "locked" | "entering-pin" | "unlocked";

function normalize(name: string) {
  return name.toLowerCase().replace(/\s*\([^)]*\)/g, "").trim();
}

function toSlug(url: string) {
  return url.startsWith(BASE) ? url.slice(BASE.length) : url;
}

export function ExerciseLinksSection() {
  const { data: session } = authClient.useSession();
  const isOwner = session?.user?.email === process.env.NEXT_PUBLIC_OWNER_EMAIL;

  // PIN gate
  const [phase, setPhase] = useState<Phase>("locked");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Links
  const { data: dbLinks = {} } = useSWR<Record<string, string>>(
    phase === "unlocked" ? API_KEY : null,
    fetcher
  );

  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [editSlugs, setEditSlugs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [clearing, setClearing] = useState<string | null>(null);

  // Deduplicate exercises by normalized name
  const uniqueExercises = useMemo(() => {
    const seen = new Map<string, string>(); // key -> display name
    for (const ex of getAllExercises()) {
      const key = normalize(ex.name);
      if (!seen.has(key)) seen.set(key, ex.name);
    }
    return Array.from(seen.entries()).map(([key, name]) => ({ key, name }));
  }, []);

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return uniqueExercises
      .filter(({ name }) => !q || name.toLowerCase().includes(q))
      .map(({ key, name }) => {
        const dbUrl = dbLinks[key] ?? null;
        const staticUrl = getExerciseLink(name);
        return { key, name, dbUrl, staticUrl };
      })
      .sort((a, b) => {
        const aLinked = !!(a.dbUrl || a.staticUrl);
        const bLinked = !!(b.dbUrl || b.staticUrl);
        if (!aLinked && bLinked) return -1;
        if (aLinked && !bLinked) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [uniqueExercises, dbLinks, search]);

  const visibleRows = showAll ? rows : rows.filter((r) => !r.dbUrl && !r.staticUrl);
  const unlinkCount = rows.filter((r) => !r.dbUrl && !r.staticUrl).length;

  if (!isOwner) return null;

  // ── PIN handlers ──────────────────────────────────────────────────────────

  async function verifyPin(fullPin: string) {
    setPinLoading(true);
    setPinError(false);
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: fullPin }),
    });
    const data = await res.json();
    if (data.valid) {
      setPhase("unlocked");
    } else {
      setPinError(true);
      setPin(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
    setPinLoading(false);
  }

  function handleDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    setPinError(false);
    if (digit && index < 3) inputRefs.current[index + 1]?.focus();
    if (digit && index === 3) {
      const fullPin = next.join("");
      if (fullPin.length === 4) verifyPin(fullPin);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  async function handleSave(key: string, name: string) {
    const slug = (editSlugs[key] ?? "").trim();
    if (!slug) return;
    setSaving(key);
    await fetch("/api/admin/exercise-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseName: name, url: BASE + slug }),
    });
    await globalMutate(API_KEY);
    setEditSlugs((prev) => { const n = { ...prev }; delete n[key]; return n; });
    setSaving(null);
  }

  async function handleClear(key: string, name: string) {
    setClearing(key);
    await fetch("/api/admin/exercise-links", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseName: name }),
    });
    await globalMutate(API_KEY);
    setClearing(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-3">
        Exercise Links
      </p>

      <div className="border border-border rounded p-3">
        {phase === "locked" && (
          <button
            onClick={() => setPhase("entering-pin")}
            className="w-full text-left text-sm text-muted hover:text-text transition-colors"
          >
            Manage exercise links
            <span className="text-[11px] text-muted block mt-0.5">Enter PIN to view and edit</span>
          </button>
        )}

        {phase === "entering-pin" && (
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-sm text-muted">Enter PIN to unlock</p>
            <div className="flex gap-3">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={pinLoading}
                  className="w-12 h-12 bg-surface border border-border text-text text-center text-xl font-bold rounded focus:border-accent focus:outline-none disabled:opacity-50"
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {pinError && <p className="text-red-400 text-xs">Wrong PIN</p>}
            {pinLoading && (
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            )}
            <button
              onClick={() => { setPhase("locked"); setPin(["", "", "", ""]); setPinError(false); }}
              className="text-xs text-muted"
            >
              Cancel
            </button>
          </div>
        )}

        {phase === "unlocked" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search exercises…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 h-8 bg-bg border border-border text-text text-xs rounded px-2 focus:border-accent focus:outline-none"
              />
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-xs text-muted hover:text-text transition-colors whitespace-nowrap"
              >
                {showAll ? "Hide linked" : `Show all (${uniqueExercises.length})`}
              </button>
            </div>

            {!showAll && !search && (
              <p className="text-[11px] text-muted">
                {unlinkCount} exercise{unlinkCount !== 1 ? "s" : ""} without a link
              </p>
            )}

            <p className="text-[10px] text-muted font-mono">
              muscleandstrength.com/exercises/<span className="text-accent">slug</span>
            </p>

            <div className="space-y-2">
              {visibleRows.map(({ key, name, dbUrl, staticUrl }) => {
                const currentSlug = key in editSlugs
                  ? editSlugs[key]
                  : dbUrl ? toSlug(dbUrl) : staticUrl ? toSlug(staticUrl) : "";
                const originalSlug = dbUrl ? toSlug(dbUrl) : staticUrl ? toSlug(staticUrl) : "";
                const isDirty = key in editSlugs && editSlugs[key] !== originalSlug;

                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-32 shrink-0">
                      <p className="text-xs text-text truncate">{name}</p>
                      {dbUrl ? (
                        <span className="text-[9px] text-accent uppercase tracking-wide">db</span>
                      ) : staticUrl ? (
                        <span className="text-[9px] text-muted uppercase tracking-wide">static</span>
                      ) : (
                        <span className="text-[9px] text-red-400 uppercase tracking-wide">none</span>
                      )}
                    </div>

                    <input
                      type="text"
                      value={currentSlug}
                      onChange={(e) => setEditSlugs((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder="e.g. bench-press.html"
                      className="flex-1 h-7 bg-bg border border-border text-text text-[11px] rounded px-2 focus:border-accent focus:outline-none min-w-0 font-mono"
                    />

                    {currentSlug && (
                      <a
                        href={BASE + currentSlug}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-accent transition-colors flex-shrink-0 text-sm leading-none"
                        aria-label="Open link"
                      >
                        ↗
                      </a>
                    )}

                    {isDirty && (
                      <button
                        onClick={() => handleSave(key, name)}
                        disabled={saving === key}
                        className="text-[11px] text-accent border border-accent/50 rounded px-2 h-7 hover:bg-accent/10 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {saving === key ? "…" : "Save"}
                      </button>
                    )}

                    {dbUrl && (
                      <button
                        onClick={() => handleClear(key, name)}
                        disabled={clearing === key}
                        className="text-[11px] text-muted border border-border rounded px-2 h-7 hover:border-red-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {clearing === key ? "…" : "Clear"}
                      </button>
                    )}
                  </div>
                );
              })}

              {visibleRows.length === 0 && (
                <p className="text-xs text-muted text-center py-2">
                  {search ? "No matches" : "All exercises have links"}
                </p>
              )}
            </div>

            <button
              onClick={() => { setPhase("locked"); setPin(["", "", "", ""]); }}
              className="text-xs text-muted pt-1"
            >
              Lock
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
