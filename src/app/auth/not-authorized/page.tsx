"use client";

import { authClient } from "@/lib/auth-client";

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-text text-xl font-medium tracking-tight">Access denied</h1>
          <p className="text-muted text-sm">
            Your account isn&apos;t on the access list. Ask the owner to add your email.
          </p>
        </div>
        <button
          onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/auth/sign-in"; } } })}
          className="w-full h-12 border border-border text-muted rounded text-sm"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
