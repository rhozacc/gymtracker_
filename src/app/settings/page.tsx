"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme, DARK_ACCENTS, LIGHT_ACCENTS } from "@/lib/useTheme";
import { useUnit } from "@/lib/useUnit";
import { authClient } from "@/lib/auth-client";
import { CURRENT_VERSION } from "@/components/UpdateSplash";
import { ExerciseLinksSection } from "@/components/ExerciseLinksSection";

const NOTIF_OPTED_OUT = "gym-notifications-off";
const ORIENT_LOCK_KEY = "gym-orientation-lock";
const LEFT_HANDED_KEY = "gym-left-handed";
const NO_UPDATE_SPLASH_KEY = "gym-no-update-splash";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-3">
      {children}
    </p>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm">{label}</p>
        {description && (
          <p className="text-[11px] text-muted mt-0.5">{description}</p>
        )}
      </div>
      <div className="ml-4 flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  enabled,
  onToggle,
  disabled,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${
        enabled ? "bg-accent" : "bg-border"
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-bg transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

type AccessPhase = "locked" | "entering-pin" | "unlocked";

interface AllowedEmail {
  id: string;
  email: string;
  createdAt: string;
}

function AccessSection() {
  const { data: session } = authClient.useSession();
  const isOwner = session?.user?.email === process.env.NEXT_PUBLIC_OWNER_EMAIL;

  const [phase, setPhase] = useState<AccessPhase>("locked");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [emails, setEmails] = useState<AllowedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOwner) return null;

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
      await loadEmails();
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

  async function loadEmails() {
    const res = await fetch("/api/admin/allowed-emails");
    const data = await res.json();
    setEmails(data);
  }

  async function handleAdd() {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    setAddLoading(true);
    setAddError("");
    const res = await fetch("/api/admin/allowed-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });
    if (res.ok) {
      setNewEmail("");
      await loadEmails();
    } else {
      const data = await res.json();
      setAddError(data.error || "Failed to add");
    }
    setAddLoading(false);
  }

  async function handleDelete(id: string) {
    await fetch("/api/admin/allowed-emails", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEmails((prev) => prev.filter((e) => e.id !== id));
    setConfirmDeleteId(null);
  }

  return (
    <div>
      <SectionLabel>Access</SectionLabel>
      <div className="border border-border rounded p-3">
        {phase === "locked" && (
          <button
            onClick={() => setPhase("entering-pin")}
            className="w-full text-left text-sm text-muted hover:text-text transition-colors"
          >
            Manage access list
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
            <p className="text-xs text-muted">Friends who can sign in with their Google account</p>

            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setAddError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                placeholder="friend@gmail.com"
                className="flex-1 h-9 bg-bg border border-border text-text text-sm rounded px-3 focus:border-accent focus:outline-none"
              />
              {newEmail.trim() ? (
                <button
                  onClick={handleAdd}
                  disabled={addLoading}
                  className="h-9 px-4 bg-accent text-bg text-sm font-medium rounded disabled:opacity-50"
                >
                  {addLoading ? "..." : "Add"}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      const trimmed = text.trim();
                      if (trimmed) { setNewEmail(trimmed); setAddError(""); }
                    } catch { /* clipboard denied */ }
                  }}
                  className="h-9 px-4 border border-border text-muted text-sm rounded hover:border-accent hover:text-accent transition-colors"
                >
                  Paste
                </button>
              )}
            </div>
            {addError && <p className="text-red-400 text-xs">{addError}</p>}

            {emails.length === 0 ? (
              <p className="text-xs text-muted italic">No emails added yet</p>
            ) : (
              <ul className="space-y-2">
                {emails.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm truncate">{e.email}</span>
                    {confirmDeleteId === e.id ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="text-xs text-red-400 font-medium hover:text-red-300 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-muted hover:text-text transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(e.id)}
                        className="text-muted hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none"
                        aria-label={`Remove ${e.email}`}
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => { setPhase("locked"); setPin(["", "", "", ""]); }}
              className="text-xs text-muted pt-1"
            >
              Lock
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 border border-border rounded p-3">
        <Link href="/admin/exercises" className="text-sm text-accent hover:opacity-80 transition-opacity">
          Muscle contribution editor
        </Link>
        <p className="text-[11px] text-muted mt-0.5">Edit how each exercise credits muscle groups on the radar</p>
      </div>
    </div>
  );
}

export default function Settings() {
  const router = useRouter();
  const { theme, preference: themePref, setTheme, darkAccent, lightAccent, setAccent } = useTheme();
  const { unit, setUnit } = useUnit();

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifSupported, setNotifSupported] = useState<boolean | null>(null);
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission>("default");
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    const supported = "Notification" in window;
    setNotifSupported(supported);
    if (!supported) return;
    setNotifPermission(Notification.permission);
    setNotifEnabled(
      Notification.permission === "granted" &&
        localStorage.getItem(NOTIF_OPTED_OUT) !== "1"
    );
  }, []);

  async function handleEnableNotifications() {
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === "granted") {
      localStorage.removeItem(NOTIF_OPTED_OUT);
      setNotifEnabled(true);
      const { subscribeToPush } = await import("@/lib/push-subscribe");
      subscribeToPush().catch(() => {});
    }
  }

  async function handleToggleNotifications() {
    const next = !notifEnabled;
    setNotifEnabled(next);
    if (next) {
      localStorage.removeItem(NOTIF_OPTED_OUT);
      const { subscribeToPush } = await import("@/lib/push-subscribe");
      subscribeToPush().catch(() => {});
    } else {
      localStorage.setItem(NOTIF_OPTED_OUT, "1");
      const { unsubscribeFromPush } = await import("@/lib/push-subscribe");
      unsubscribeFromPush().catch(() => {});
    }
  }

  // ── Update splash ─────────────────────────────────────────────────────────
  const [updateSplashEnabled, setUpdateSplashEnabled] = useState(true);

  useEffect(() => {
    setUpdateSplashEnabled(localStorage.getItem(NO_UPDATE_SPLASH_KEY) !== "1");
  }, []);

  function handleUpdateSplashToggle() {
    const next = !updateSplashEnabled;
    setUpdateSplashEnabled(next);
    if (next) localStorage.removeItem(NO_UPDATE_SPLASH_KEY);
    else localStorage.setItem(NO_UPDATE_SPLASH_KEY, "1");
  }

  // ── Post-session extras & debrief ─────────────────────────────────────────
  const [extrasEnabled, setExtrasEnabled] = useState(true);
  const [debriefEnabled, setDebriefEnabled] = useState(true);

  useEffect(() => {
    setExtrasEnabled(localStorage.getItem("gym-disable-extras") !== "true");
    setDebriefEnabled(localStorage.getItem("gym-disable-debrief") !== "true");
  }, []);

  function handleExtrasToggle() {
    const next = !extrasEnabled;
    setExtrasEnabled(next);
    if (next) localStorage.removeItem("gym-disable-extras");
    else localStorage.setItem("gym-disable-extras", "true");
  }

  function handleDebriefToggle() {
    const next = !debriefEnabled;
    setDebriefEnabled(next);
    if (next) localStorage.removeItem("gym-disable-debrief");
    else localStorage.setItem("gym-disable-debrief", "true");
  }

  // ── Warmup sets ───────────────────────────────────────────────────────────
  const [warmupsEnabled, setWarmupsEnabled] = useState(true);
  const [hasCustomWarmupPrefs, setHasCustomWarmupPrefs] = useState(false);

  useEffect(() => {
    setWarmupsEnabled(localStorage.getItem("gym-disable-warmups") !== "true");
    try {
      const prefs = JSON.parse(localStorage.getItem("gym-warmup-prefs") || "{}");
      setHasCustomWarmupPrefs(Object.keys(prefs).length > 0);
    } catch { /* ignore */ }
  }, []);

  function handleWarmupsToggle() {
    const next = !warmupsEnabled;
    setWarmupsEnabled(next);
    if (next) {
      localStorage.removeItem("gym-disable-warmups");
    } else {
      localStorage.setItem("gym-disable-warmups", "true");
    }
  }

  // ── Left-handed mode ───────────────────────────────────────────────────────
  const [leftHanded, setLeftHanded] = useState(false);

  useEffect(() => {
    setLeftHanded(localStorage.getItem(LEFT_HANDED_KEY) === "1");
  }, []);

  function handleLeftHandedToggle() {
    const next = !leftHanded;
    setLeftHanded(next);
    if (next) {
      localStorage.setItem(LEFT_HANDED_KEY, "1");
    } else {
      localStorage.removeItem(LEFT_HANDED_KEY);
    }
  }

  // ── Orientation lock ───────────────────────────────────────────────────────
  const [orientSupported, setOrientSupported] = useState(false);
  const [orientLocked, setOrientLocked] = useState(false);

  useEffect(() => {
    const supported =
      "orientation" in screen &&
      typeof (
        screen.orientation as ScreenOrientation & { lock?: unknown }
      ).lock === "function";
    setOrientSupported(supported);
    setOrientLocked(localStorage.getItem(ORIENT_LOCK_KEY) === "1");
  }, []);

  async function handleOrientToggle() {
    const next = !orientLocked;
    setOrientLocked(next);
    if (next) {
      localStorage.setItem(ORIENT_LOCK_KEY, "1");
      try {
        await (
          screen.orientation as ScreenOrientation & {
            lock: (o: string) => Promise<void>;
          }
        ).lock("portrait");
      } catch {
        // Only works in standalone PWA mode
      }
    } else {
      localStorage.removeItem(ORIENT_LOCK_KEY);
      screen.orientation.unlock();
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="w-8 h-8 flex items-center justify-center text-muted hover:text-text transition-colors"
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-lg font-medium">Settings</h1>
      </div>

      {/* Notifications */}
      <div>
        <SectionLabel>Notifications</SectionLabel>
        <div className="border border-border rounded p-3 space-y-3">
          {notifSupported === null ? (
            <div className="h-10 rounded bg-surface animate-pulse" />
          ) : !notifSupported ? (
            <Row label="Rest timer alerts" description="Not supported in this browser">
              <span className="text-[11px] text-muted">Unavailable</span>
            </Row>
          ) : notifPermission === "denied" ? (
            <Row label="Rest timer alerts" description="Blocked — enable in device settings">
              <span className="text-[11px] text-muted">Blocked</span>
            </Row>
          ) : notifPermission === "default" ? (
            <Row label="Rest timer alerts" description="Get notified when rest is over">
              <button
                onClick={handleEnableNotifications}
                className="text-xs text-accent border border-accent rounded px-3 h-7 hover:bg-accent hover:text-bg transition-colors"
              >
                Enable
              </button>
            </Row>
          ) : (
            <Row label="Rest timer alerts" description="Notify when rest period ends">
              <Toggle enabled={notifEnabled} onToggle={handleToggleNotifications} />
            </Row>
          )}
          <div className="border-t border-border" />
          <Row label="App update screen" description="Show what's new after each update">
            <Toggle enabled={updateSplashEnabled} onToggle={handleUpdateSplashToggle} />
          </Row>
        </div>
      </div>

      {/* Appearance */}
      <div>
        <SectionLabel>Appearance</SectionLabel>
        <div className="border border-border rounded p-3 space-y-3">
          <Row label="Theme" description={themePref === "system" ? "Auto" : themePref === "dark" ? "Dark" : "Light"}>
            <div className="flex gap-1">
              {(["dark", "system", "light"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setTheme(p)}
                  className={`px-2.5 h-7 text-xs rounded transition-colors ${
                    themePref === p
                      ? "bg-accent text-bg font-medium"
                      : "text-muted border border-border"
                  }`}
                >
                  {p === "system" ? "Auto" : p === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </Row>
          <div className="border-t border-border" />
          {/* Accent picker */}
          <div className="space-y-3">
            {(theme === "dark" || themePref !== "light") && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted mb-2">
                  {themePref === "system" ? "Dark accent" : "Accent"}
                </p>
                <div className="flex gap-4">
                  {DARK_ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAccent(a.value, "dark")}
                      title={a.name}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-8 h-8 rounded-full transition-all duration-200 ${
                          darkAccent === a.value ? "scale-110" : "opacity-40 hover:opacity-70"
                        }`}
                        style={{
                          backgroundColor: a.value,
                          boxShadow: darkAccent === a.value
                            ? `0 0 0 2px var(--color-bg), 0 0 0 3px ${a.value}`
                            : "none",
                        }}
                      />
                      <span className={`text-[10px] ${darkAccent === a.value ? "text-text" : "text-muted"}`}>
                        {a.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(theme === "light" || themePref !== "dark") && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted mb-2">
                  {themePref === "system" ? "Light accent" : "Accent"}
                </p>
                <div className="flex gap-4">
                  {LIGHT_ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAccent(a.value, "light")}
                      title={a.name}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-8 h-8 rounded-full transition-all duration-200 ${
                          lightAccent === a.value ? "scale-110" : "opacity-40 hover:opacity-70"
                        }`}
                        style={{
                          backgroundColor: a.value,
                          boxShadow: lightAccent === a.value
                            ? `0 0 0 2px var(--color-bg), 0 0 0 3px ${a.value}`
                            : "none",
                        }}
                      />
                      <span className={`text-[10px] ${lightAccent === a.value ? "text-text" : "text-muted"}`}>
                        {a.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-border" />
          <Row label="Left-handed mode" description="End Session on the right during workouts">
            <Toggle enabled={leftHanded} onToggle={handleLeftHandedToggle} />
          </Row>
          {orientSupported && (
            <Row label="Lock orientation" description="Stay in portrait mode">
              <Toggle enabled={orientLocked} onToggle={handleOrientToggle} />
            </Row>
          )}
        </div>
      </div>

      {/* Workout */}
      <div>
        <SectionLabel>Workout</SectionLabel>
        <div className="border border-border rounded p-3 space-y-3">
          <div>
            <Row label="Warmup sets" description="Include a warmup set before each exercise">
              <Toggle enabled={warmupsEnabled} onToggle={handleWarmupsToggle} />
            </Row>
            <div className="mt-2 pl-0 space-y-1">
              {hasCustomWarmupPrefs && (
                <p className="text-[11px] text-muted leading-relaxed">
                  Toggling off will override your custom warmup settings, but will not delete your customization.
                </p>
              )}
              <Link
                href="/plan"
                className="inline-flex items-center gap-1 text-[11px] text-accent hover:opacity-80 transition-opacity"
              >
                Turn on by exercise
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 10L10 2M10 2H4.5M10 2V7.5"/>
                </svg>
              </Link>
            </div>
          </div>
          <div className="border-t border-border" />
          <Row label="Post-session extras" description="Core, cardio or stretch after lifting">
            <Toggle enabled={extrasEnabled} onToggle={handleExtrasToggle} />
          </Row>
          <div className="border-t border-border" />
          <Row label="Post-workout debrief" description="Summary and notes after each session">
            <Toggle enabled={debriefEnabled} onToggle={handleDebriefToggle} />
          </Row>
        </div>
      </div>

      {/* Units */}
      <div>
        <SectionLabel>Units</SectionLabel>
        <div className="border border-border rounded p-3">
          <Row label="Weight">
            <div className="flex gap-1">
              {(["kg", "lbs"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-3 h-7 rounded text-xs transition-colors ${
                    unit === u
                      ? "bg-accent text-bg font-medium"
                      : "border border-border text-muted hover:border-accent"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </Row>
        </div>
      </div>

      {/* Access — only visible to owner */}
      <AccessSection />

      {/* Exercise links — only visible to owner */}
      <ExerciseLinksSection />

      {/* Account */}
      <div>
        <SectionLabel>Account</SectionLabel>
        <div className="border border-border rounded p-3 space-y-3">
          <button
            onClick={() => router.push("/onboarding")}
            className="w-full text-left text-sm text-muted hover:text-text transition-colors"
          >
            Onboarding
          </button>
          <div className="border-t border-border" />
          <button
            onClick={() =>
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => { window.location.href = "/auth/sign-in"; },
                },
              })
            }
            className="w-full text-left text-sm text-muted hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <p className="text-center text-[10px] text-muted/40 pt-2">v{CURRENT_VERSION}</p>

    </div>
  );
}
