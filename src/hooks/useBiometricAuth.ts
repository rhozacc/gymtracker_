"use client";

import { useState, useEffect } from "react";
import {
  isBiometricSupported,
  isBiometricEnrolled,
  registerBiometric,
  disableBiometric,
} from "@/lib/webauthn";

export function useBiometricAuth() {
  const [bioEnabled, setBioEnabled] = useState<boolean | null>(null);
  const [bioSupported, setBioSupported] = useState(false);
  const [bioConfirm, setBioConfirm] = useState(false);
  const [bioPin, setBioPin] = useState("");
  const [bioBusy, setBioBusy] = useState(false);
  const [bioError, setBioError] = useState("");

  useEffect(() => {
    isBiometricSupported().then(setBioSupported);
    isBiometricEnrolled().then(setBioEnabled);
  }, []);

  async function handleBioToggle() {
    if (bioEnabled) {
      setBioConfirm(true);
      setBioError("");
    } else {
      setBioBusy(true);
      const ok = await registerBiometric();
      setBioBusy(false);
      if (ok) setBioEnabled(true);
    }
  }

  async function confirmDisableBio() {
    setBioBusy(true);
    setBioError("");
    const ok = await disableBiometric(bioPin);
    setBioBusy(false);
    if (ok) {
      setBioEnabled(false);
      setBioConfirm(false);
      setBioPin("");
    } else {
      setBioError("Wrong PIN");
    }
  }

  function cancelDisableBio() {
    setBioConfirm(false);
    setBioPin("");
    setBioError("");
  }

  return {
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
  };
}
