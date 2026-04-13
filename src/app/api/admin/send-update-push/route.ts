import { NextResponse } from "next/server";
import { pushToAll } from "@/lib/web-push";
import { WHATS_NEW } from "@/lib/whats-new";
import { requireSession } from "@/lib/api-auth";

function isOwner(email: string) {
  return email === process.env.OWNER_EMAIL;
}

function isAuthorized(req: Request, email: string | null): boolean {
  const secret = process.env.ADMIN_PUSH_SECRET;
  if (secret && req.headers.get("Authorization") === `Bearer ${secret}`) return true;
  if (email && isOwner(email)) return true;
  return false;
}

export async function POST(req: Request) {
  // Allow either session-based owner auth or static secret (for deploy hooks)
  let email: string | null = null;
  try {
    const result = await requireSession();
    email = result.email;
  } catch {
    // No session — fall through to secret check
  }

  if (!isAuthorized(req, email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const areas = WHATS_NEW.map((e) => e.area).join(" · ");
  const body = WHATS_NEW[0]?.text ?? "Check out what's new.";

  const { sent, failed } = await pushToAll({
    title: "gymtracker_ updated",
    body: areas ? `${areas}\n\n${body}` : body,
    tag: "gym-update",
  });

  return NextResponse.json({ sent, failed });
}
