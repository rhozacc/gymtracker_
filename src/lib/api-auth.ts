import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return {
      userId: null as null,
      email: null as null,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return {
    userId: session.user.id,
    email: session.user.email,
    res: null as null,
  };
}
