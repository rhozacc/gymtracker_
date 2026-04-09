import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getRpId, getOrigin, consumeChallenge } from "@/lib/webauthn-server";

export async function POST(request: Request) {
  const body = await request.json();
  const rpId = getRpId(request);
  const origin = getOrigin(request);

  const challenge = await consumeChallenge(body.response?.clientDataJSON ? body.response.clientDataJSON : "", "registration");

  // We need to find the challenge differently — the challenge is embedded in clientDataJSON
  // Instead, consume the most recent registration challenge
  const row = await prisma.webAuthnChallenge.findFirst({
    where: { type: "registration", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    return NextResponse.json({ error: "Challenge expired or not found" }, { status: 400 });
  }

  await prisma.webAuthnChallenge.delete({ where: { id: row.id } });

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: row.challenge,
      expectedOrigin: origin,
      expectedRPID: rpId,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const { credential, credentialDeviceType } = verification.registrationInfo;

    await prisma.webAuthnCredential.create({
      data: {
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        transports: credential.transports || [],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
