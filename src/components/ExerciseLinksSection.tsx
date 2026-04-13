"use client";

import { useState, useMemo } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/lib/swr";
import { getAllExercises } from "@/lib/program";
import { getExerciseLink } from "@/lib/exerciseLinks";
import { authClient } from "@/lib/auth-client";

const API_KEY = "/api/exercise-links";

function normalize(name: string) {
  return name.toLowerCase().replace(/\s*\([^)]*\)/g, "").trim();
}

export function ExerciseLinksSection() {
  const { data: session } = authClient.useSession();
  const isOwner = session?.user?.email === process.env.NEXT_PUBLIC_OWNER_EMAIL;

  const { data: dbLinks = {} } = useSWR<Record<string, string>>(API_KEY, fetcher);

  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [editUrls, setEditUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [clearing, setClearing] = useState<string | null>(null);

  const allExercises = useMemo(() => getAllExercises(), []);

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allExercises
      .filter((ex) => !q || ex.name.toLowerCase().includes(q))
      .map((ex) => {
        const key = normalize(ex.name);
        const dbUrl = dbLinks[key] ?? null;
        const staticUrl = getExerciseLink(ex.name);
        return { ex, key, dbUrl, staticUrl };
      })
      .sort((a, b) => {
        // un-linked first
        const aLinked = !!(a.dbUrl || a.staticUrl);
        const bLinked = !!(b.dbUrl || b.staticUrl);
        if (!aLinked && bLinked) return -1;
        if (aLinked && !bLinked) return 1;
        return a.ex.name.localeCompare(b.ex.name);
      });
  }, [allExercises, dbLinks, search]);

  const visibleRows = showAll ? rows : rows.filter((r) => !r.dbUrl && !r.staticUrl);
  const unlinkCount = rows.filter((r) => !r.dbUrl && !r.staticUrl).length;

  if (!isOwner) return null;

  async function handleSave(key: string, name: string) {
    const url = (editUrls[key] ?? "").trim();
    if (!url) return;
    setSaving(key);
    await fetch("/api/admin/exercise-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseName: name, url }),
    });
    await globalMutate(API_KEY);
    setEditUrls((prev) => { const n = { ...prev }; delete n[key]; return n; });
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

  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-3">
        Exercise Links
      </p>

      <div className="border border-border rounded p-3 space-y-3">
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
            {showAll ? `Hide linked` : `Show all (${allExercises.length})`}
          </button>
        </div>

        {!showAll && !search && (
          <p className="text-[11px] text-muted">
            {unlinkCount} exercise{unlinkCount !== 1 ? "s" : ""} with no link
          </p>
        )}

        <div className="space-y-2">
          {visibleRows.map(({ ex, key, dbUrl, staticUrl }) => {
            const currentInput = editUrls[key] ?? dbUrl ?? staticUrl ?? "";
            const isDirty = key in editUrls && editUrls[key] !== (dbUrl ?? staticUrl ?? "");
            return (
              <div key={key} className="flex items-center gap-2">
                <div className="w-36 shrink-0">
                  <p className="text-xs text-text truncate">{ex.name}</p>
                  {dbUrl ? (
                    <span className="text-[9px] text-accent uppercase tracking-wide">db</span>
                  ) : staticUrl ? (
                    <span className="text-[9px] text-muted uppercase tracking-wide">static</span>
                  ) : (
                    <span className="text-[9px] text-red-400 uppercase tracking-wide">none</span>
                  )}
                </div>

                <input
                  type="url"
                  value={currentInput}
                  onChange={(e) => setEditUrls((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder="https://muscleandstrength.com/exercises/…"
                  className="flex-1 h-7 bg-bg border border-border text-text text-[11px] rounded px-2 focus:border-accent focus:outline-none min-w-0"
                />

                {isDirty && (
                  <button
                    onClick={() => handleSave(key, ex.name)}
                    disabled={saving === key}
                    className="text-[11px] text-accent border border-accent/50 rounded px-2 h-7 hover:bg-accent/10 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {saving === key ? "…" : "Save"}
                  </button>
                )}

                {dbUrl && (
                  <button
                    onClick={() => handleClear(key, ex.name)}
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
      </div>
    </div>
  );
}
