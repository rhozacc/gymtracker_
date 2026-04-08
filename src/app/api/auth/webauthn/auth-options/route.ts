import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getRpId, storeChallenge } from "@/lib/webauthn-server";

export async function POST(request: Request) {
  const credentials = await prisma.webAuthnCredential.findMany({
    select: { credentialId: true, transports: true },
  });

  if (credentials.length === 0) {
    return NextResponse.json({ available: false });
  }

  const rpId = getRpId(request);

  const options = await generateAuthenticationOptions({
    rpID: rpId,
    userVerification: "preferred",
    allowCredentials: credentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports as AuthenticatorTransport[],
    })),
  });

  await storeChallenge(options.challenge, "authentication");

  return NextResponse.json({ available: true, options });
}
