"use client";

import { useRouter } from "next/navigation";
import { Welcome } from "@/components/welcome/Welcome";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <Welcome onDone={() => router.push("/")} />
  );
}
