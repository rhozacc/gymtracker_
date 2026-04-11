import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

function isOwner(email: string) {
  return email === process.env.OWNER_EMAIL;
}

async function sendInviteEmail(toEmail: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip if not configured

  const resend = new Resend(apiKey);
  const appUrl = process.env.BETTER_AUTH_URL || "https://gym.alenrozac.com";

  await resend.emails.send({
    from: "gymtracker_ <onboarding@resend.dev>",
    to: toEmail,
    subject: "You've been invited to gymtracker_",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #e8e8e8;">
        <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 8px;">gymtracker_</h1>
        <p style="color: #666; font-size: 13px; margin: 0 0 32px;">Track sessions. Progressive overload. Stay consistent.</p>
        <p style="font-size: 14px; margin: 0 0 24px;">You've been given access. Sign in with your Google account to get started.</p>
        <a href="${appUrl}" style="display: inline-block; background: #39ff14; color: #0a0a0a; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 6px; text-decoration: none;">Open gymtracker_</a>
        <p style="color: #444; font-size: 12px; margin: 32px 0 0;">Sign in at ${appUrl} using the Google account this email was sent to.</p>
      </div>
    `,
  });
}

export async function GET() {
  const { email, res } = await requireSession();
  if (res) return res;
  if (!isOwner(email!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const emails = await prisma.allowedEmail.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(emails);
}

export async function POST(req: Request) {
  const { email, res } = await requireSession();
  if (res) return res;
  if (!isOwner(email!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const newEmail = body.email?.trim().toLowerCase();
  if (!newEmail) return NextResponse.json({ error: "Email required" }, { status: 400 });

  try {
    const entry = await prisma.allowedEmail.create({ data: { email: newEmail } });
    // Fire-and-forget invite email — don't block the response
    sendInviteEmail(newEmail).catch(() => {});
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
  const { email, res } = await requireSession();
  if (res) return res;
  if (!isOwner(email!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.allowedEmail.delete({ where: { id: body.id } });
  return NextResponse.json({ deleted: true });
}
