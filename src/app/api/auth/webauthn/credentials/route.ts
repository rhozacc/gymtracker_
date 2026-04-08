import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await prisma.webAuthnCredential.count();
  return NextResponse.json({ enabled: count > 0 });
}

export async function DELETE(request: Request) {
  const { pin } = await request.json();
  if (pin !== process.env.APP_PIN) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 403 });
  }

  await prisma.webAuthnCredential.deleteMany();
  // Also clean up any leftover challenges
  await prisma.webAuthnChallenge.deleteMany();

  return NextResponse.json({ success: true });
}
