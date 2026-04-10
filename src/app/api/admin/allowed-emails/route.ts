import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

function isOwner(email: string) {
  return email === process.env.OWNER_EMAIL;
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
