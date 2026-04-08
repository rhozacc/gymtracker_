"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

interface ExerciseRenameModalProps {
  exerciseName: string;
  exerciseId: string;
  planSlug: string;
  dayKey: string;
  onDone: () => void;
  onCancel: () => void;
}

export function ExerciseRenameModal({
  exerciseName,
  exerciseId,
  planSlug,
  dayKey,
  onDone,
  onCancel,
}: ExerciseRenameModalProps) {
  const [newName, setNewName] = useState(exerciseName);
  const [saving, setSaving] = useState(false);

  const nameChanged = newName.trim() !== "" && newName.trim() !== exerciseName;

  async function handleRename(mode: "rename" | "new") {
    if (!nameChanged || saving) return;
    setSaving(true);

    await fetch("/api/exercises/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planSlug,
        dayKey,
        exerciseId,
        newName: newName.trim(),
        mode,
      }),
    });

    setSaving(false);
    onDone();
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/90 px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-lg p-5 space-y-4">
        <div>
          <h2 className="text-sm font-medium">Rename Exercise</h2>
          <p className="text-muted text-xs mt-1">
            Current: <span className="text-text">{exerciseName}</span>
          </p>
        </div>

        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          autoFocus
          placeholder="New exercise name"
          className="w-full h-10 bg-bg border border-border text-text text-sm rounded px-3 focus:border-accent focus:outline-none"
        />

        <div className="space-y-2">
          <button
            onClick={() => handleRename("rename")}
            disabled={!nameChanged || saving}
            className="w-full h-11 bg-accent text-bg font-medium rounded text-sm disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving..." : "Rename (updates history)"}
          </button>
          <button
            onClick={() => handleRename("new")}
            disabled={!nameChanged || saving}
            className="w-full h-11 border border-border text-text rounded text-sm hover:border-muted disabled:opacity-40 transition-colors"
          >
            Create as new exercise
          </button>
          <p className="text-muted text-[10px] text-center">
            &ldquo;Rename&rdquo; keeps all past session data.
            &ldquo;Create new&rdquo; starts fresh — old history stays under the old name.
          </p>
        </div>

        <button
          onClick={onCancel}
          className="w-full text-muted text-sm hover:text-accent transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}
