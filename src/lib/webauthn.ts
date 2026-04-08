"use client";

import {
  startRegistration,
  startAuthentication,
  platformAuthenticatorIsAvailable,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

const BIOMETRIC_KEY = "gym-biometric";
const DISMISS_KEY = "gym-biometric-dismissed";
const DISMISS_DAYS = 30;

/** Check if the platform has a biometric authenticator (Face ID / Touch ID) */
export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!browserSupportsWebAuthn()) return false;
  return platformAuthenticatorIsAvailable();
}

/** Check if biometric credentials are enrolled on the server */
export async function isBiometricEnrolled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(BIOMETRIC_KEY) !== "true") return false;
  try {
    const res = await fetch("/api/auth/webauthn/credentials");
    const data = await res.json();
    return data.enabled === true;
  } catch {
    return false;
  }
}

/** Check if enrollment was recently dismissed */
export function wasEnrollmentDismissed(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const dismissedAt = parseInt(dismissed, 10);
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_DAYS;
}

/** Mark enrollment as dismissed */
export function dismissEnrollment() {
  localStorage.setItem(DISMISS_KEY, Date.now().toString());
}

/**
 * Register a biometric credential (Face ID / Touch ID).
 * Returns true on success, false on failure/cancellation.
 */
export async function registerBiometric(): Promise<boolean> {
  try {
    const optionsRes = await fetch("/api/auth/webauthn/register-options", {
      method: "POST",
    });
    const options = await optionsRes.json();

    const registration = await startRegistration({ optionsJSON: options });

    const verifyRes = await fetch("/api/auth/webauthn/register-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registration),
    });
    const result = await verifyRes.json();

    if (result.success) {
      localStorage.setItem(BIOMETRIC_KEY, "true");
      localStorage.removeItem(DISMISS_KEY);
      return true;
    }
    return false;
  } catch {
    // User cancelled or browser error
    return false;
  }
}

/**
 * Authenticate with biometric (Face ID / Touch ID).
 * Returns true if authenticated, false if failed/cancelled/unavailable.
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const optionsRes = await fetch("/api/auth/webauthn/auth-options", {
      method: "POST",
    });
    const data = await optionsRes.json();

    if (!data.available) {
      localStorage.removeItem(BIOMETRIC_KEY);
      return false;
    }

    const authentication = await startAuthentication({ optionsJSON: data.options });

    const verifyRes = await fetch("/api/auth/webauthn/auth-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authentication),
    });
    const result = await verifyRes.json();

    return result.valid === true;
  } catch {
    // User cancelled or browser error
    return false;
  }
}

/** Remove all biometric credentials (requires PIN) */
export async function disableBiometric(pin: string): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/webauthn/credentials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.removeItem(BIOMETRIC_KEY);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
