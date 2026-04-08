import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getRpId, getOrigin, RP_NAME, storeChallenge } from "@/lib/webauthn-server";

export async function POST(request: Request) {
  const rpId = getRpId(request);

  const existing = await prisma.webAuthnCredential.findMany({
    select: { credentialId: true, transports: true },
  });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpId,
    userName: "owner",
    userDisplayName: "App Owner",
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: existing.map((c) => ({
      id: c.credentialId,
      transports: c.transports as AuthenticatorTransport[],
    })),
  });

  await storeChallenge(options.challenge, "registration");

  return NextResponse.json(options);
}
