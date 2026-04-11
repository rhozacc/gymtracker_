"use client";

import { useState, useEffect, useCallback } from "react";

const DISMISS_KEY = "gym-pwa-dismiss";
const DISMISS_DAYS = 30;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iP(hone|ad|od)/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

function wasDismissed(): boolean {
  try {
    const val = localStorage.getItem(DISMISS_KEY);
    if (!val) return false;
    const days = (Date.now() - parseInt(val, 10)) / (1000 * 60 * 60 * 24);
    return days < DISMISS_DAYS;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Already installed or recently dismissed
    if (isStandalone() || wasDismissed()) return;

    if (isIosSafari()) {
      setShowIos(true);
      setVisible(true);
      return;
    }

    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (!visible) return null;

  // iOS Safari — manual instructions
  if (showIos) {
    return (
      <div className="fixed bottom-6 inset-x-0 px-4 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-sm bg-surface border border-border rounded-lg p-4 pointer-events-auto relative">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 text-muted hover:text-accent transition-colors"
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="flex items-start gap-3 pr-6">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0 mt-0.5">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <div>
              <p className="text-sm font-medium mb-1">Install gymtracker_</p>
              <p className="text-muted text-xs leading-relaxed">
                Tap the <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline align-middle mx-0.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg> Share button, then <strong>Add to Home Screen</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android/Chrome — can trigger install directly
  return (
    <div className="fixed bottom-6 inset-x-0 px-4 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-sm bg-surface border border-border rounded-lg p-4 pointer-events-auto relative">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-muted hover:text-accent transition-colors"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="flex items-center gap-3 pr-6">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium">Install gymtracker_</p>
            <p className="text-muted text-xs">Add to home screen for the full experience</p>
          </div>
          <button
            onClick={install}
            disabled={installing}
            className="shrink-0 px-4 h-9 bg-accent text-bg text-sm font-medium rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {installing ? "..." : "Install"}
          </button>
        </div>
      </div>
    </div>
  );
}
