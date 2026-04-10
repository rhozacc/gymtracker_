"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/useTheme";
import { useUnit } from "@/lib/useUnit";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { BiometricConfirmModal } from "@/components/BiometricConfirmModal";

const NOTIF_OPTED_OUT = "gym-notifications-off";
const ORIENT_LOCK_KEY = "gym-orientation-lock";
const LEFT_HANDED_KEY = "gym-left-handed";

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

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { unit, setUnit } = useUnit();

  const {
    bioEnabled,
    bioSupported,
    bioConfirm,
    bioPin,
    bioBusy,
    bioError,
    setBioPin,
    setBioError,
    handleBioToggle,
    confirmDisableBio,
    cancelDisableBio,
  } = useBiometricAuth();

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
    }
  }

  function handleToggleNotifications() {
    const next = !notifEnabled;
    setNotifEnabled(next);
    if (next) {
      localStorage.removeItem(NOTIF_OPTED_OUT);
    } else {
      localStorage.setItem(NOTIF_OPTED_OUT, "1");
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
        // Only works in standalone PWA mode — silently ignore otherwise
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
        </div>
      </div>

      {/* Appearance */}
      <div>
        <SectionLabel>Appearance</SectionLabel>
        <div className="border border-border rounded p-3 space-y-3">
          <Row label="Theme" description={theme === "dark" ? "Dark" : "Light"}>
            <Toggle enabled={theme === "dark"} onToggle={toggleTheme} />
          </Row>
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

      {/* Security */}
      {bioSupported && bioEnabled !== null && (
        <div>
          <SectionLabel>Security</SectionLabel>
          <div className="border border-border rounded p-3">
            <Row label="Biometric login" description="Use biometric to unlock">
              <Toggle
                enabled={!!bioEnabled}
                onToggle={handleBioToggle}
                disabled={bioBusy}
              />
            </Row>
          </div>
        </div>
      )}

      {bioConfirm && (
        <BiometricConfirmModal
          pin={bioPin}
          busy={bioBusy}
          error={bioError}
          onPinChange={(p) => {
            setBioPin(p);
            setBioError("");
          }}
          onConfirm={confirmDisableBio}
          onCancel={cancelDisableBio}
        />
      )}
    </div>
  );
}
