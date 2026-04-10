import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Server component — enforces session + allowlist before rendering children
export async function AuthGuard({ children }: { children: React.ReactNode }) {
  const headersList = await headers();

  // Skip auth check for sign-in / error pages (middleware already excludes them,
  // but the root layout wraps everything so we need this guard too)
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-invoke-path") ?? "";
  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  const session = await auth.api.getSession({ headers: headersList });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const email = session.user.email;
  const isOwner = email === process.env.OWNER_EMAIL;

  if (!isOwner) {
    const allowed = await prisma.allowedEmail.findUnique({ where: { email } });
    if (!allowed) {
      redirect("/auth/not-authorized");
    }
  }

  return <>{children}</>;
}
