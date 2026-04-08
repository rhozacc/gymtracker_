import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getRpId, getOrigin } from "@/lib/webauthn-server";

export async function POST(request: Request) {
  const body = await request.json();
  const rpId = getRpId(request);
  const origin = getOrigin(request);

  // Find the most recent authentication challenge
  const challengeRow = await prisma.webAuthnChallenge.findFirst({
    where: { type: "authentication", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!challengeRow) {
    return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
  }

  await prisma.webAuthnChallenge.delete({ where: { id: challengeRow.id } });

  // Look up the credential
  const credential = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: body.id },
  });

  if (!credential) {
    return NextResponse.json({ error: "Credential not found" }, { status: 400 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpId,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(credential.publicKey),
        counter: Number(credential.counter),
        transports: credential.transports as AuthenticatorTransport[],
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    // Update counter
    await prisma.webAuthnCredential.update({
      where: { id: credential.id },
      data: { counter: BigInt(verification.authenticationInfo.newCounter) },
    });

    return NextResponse.json({ valid: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
