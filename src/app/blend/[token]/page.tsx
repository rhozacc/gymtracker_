"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useProgram } from "@/lib/useProgram";
import type { BlendedDayDefinition, BlendedExercise } from "@/lib/blend";

function getNextDayType(dayKeys: string[]): string {
  return dayKeys[0] ?? "";
}

export default function BlendJoinPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const { plan } = useProgram();
  const dayKeys = Object.keys(plan.days);

  const [hostName, setHostName] = useState<string>("");
  const [hostDayLabel, setHostDayLabel] = useState<string>("");
  const [inviteStatus, setInviteStatus] = useState<"loading" | "pending" | "error" | "already">("loading");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [joining, setJoining] = useState(false);
  const [preview, setPreview] = useState<BlendedDayDefinition | null>(null);

  // Default to next day
  useEffect(() => {
    if (dayKeys.length > 0 && !selectedDay) {
      setSelectedDay(getNextDayType(dayKeys));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKeys.length]);

  // Fetch invite info
  useEffect(() => {
    if (!token) return;
    fetch(`/api/blend/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error === "Not found") return setInviteStatus("error");
        if (data.error === "Expired") return setInviteStatus("error");
        if (data.status !== "pending") return setInviteStatus("already");
        setHostName(data.hostName ?? "");
        const hostDay = data.hostDay as { label?: string } | null;
        setHostDayLabel(hostDay?.label ?? data.hostDayType ?? "");
        setInviteStatus("pending");
      })
      .catch(() => setInviteStatus("error"));
  }, [token]);

  async function handleJoin() {
    if (!selectedDay || joining) return;
    const day = plan.days[selectedDay];
    if (!day) return;

    setJoining(true);
    try {
      const res = await fetch(`/api/blend/${token}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayType: selectedDay, day }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPreview(data.blendedDay as BlendedDayDefinition);
      // Short preview then go to confirmation page (both users must approve)
      setTimeout(() => router.push(`/blend/${token}/confirm`), 1200);
    } catch {
      setJoining(false);
    }
  }

  if (inviteStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted text-sm">Loading invite...</p>
      </div>
    );
  }

  if (inviteStatus === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
        <p className="text-text font-medium">Invite not found or expired</p>
        <p className="text-muted text-sm">Ask your partner for a fresh code.</p>
        <button
          onClick={() => router.push("/")}
          className="text-accent text-sm hover:opacity-75 transition-opacity"
        >
          Go home
        </button>
      </div>
    );
  }

  if (inviteStatus === "already") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
        <p className="text-text font-medium">Session already started</p>
        <button
          onClick={() => router.push(`/blend/${token}/confirm`)}
          className="h-12 px-6 bg-accent text-bg font-medium rounded-lg text-sm"
        >
          Rejoin
        </button>
      </div>
    );
  }

  // Preview of blended session (after joining)
  if (preview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
        <p className="text-accent font-medium text-lg">Let&apos;s blend!</p>
        <p className="text-muted text-sm">{preview.label}</p>
        <div className="w-full max-w-sm space-y-1 mt-2">
          {(preview.exercises as BlendedExercise[]).slice(0, 6).map((ex, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
            >
              <span className="text-sm">{ex.name}</span>
              <span className={`text-[10px] font-medium uppercase tracking-widest ${
                ex.owner === "host" ? "text-accent" : "text-muted"
              }`}>
                {ex.ownerName}
              </span>
            </div>
          ))}
          {preview.exercises.length > 6 && (
            <p className="text-muted text-xs pt-1">+{preview.exercises.length - 6} more</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => router.back()}
          className="text-muted hover:text-accent transition-colors"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-lg font-medium">Join blend</h1>
      </div>

      <div className="flex-1 flex flex-col p-6 space-y-8 max-w-sm mx-auto w-full">
        {/* Host info */}
        <div className="text-center space-y-1">
          <p className="text-text font-medium text-lg">{hostName} invited you</p>
          {hostDayLabel && (
            <p className="text-muted text-sm">They&apos;re bringing {hostDayLabel}</p>
          )}
        </div>

        {/* Guest day selector */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
            Your day
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {dayKeys.map((key) => {
              const day = plan.days[key];
              if (!day) return null;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(key)}
                  className={`w-full text-left border rounded p-2.5 text-sm transition-colors ${
                    selectedDay === key
                      ? "border-accent bg-accent/5 text-text"
                      : "border-border text-muted hover:border-muted"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={!selectedDay || joining}
          className="w-full h-12 bg-accent text-bg font-medium rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {joining ? "Blending..." : "Let's blend"}
        </button>
      </div>
    </div>
  );
}
