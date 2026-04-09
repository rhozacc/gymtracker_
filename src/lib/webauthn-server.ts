import { prisma } from "@/lib/prisma";

export const RP_NAME = "gymtracker_";

export function getRpId(request: Request): string {
  if (process.env.RP_ID) return process.env.RP_ID;
  const host = request.headers.get("host") || "localhost";
  return host.split(":")[0]; // strip port
}

export function getOrigin(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("host") || "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

/** Store a challenge in the DB with 60-second TTL */
export async function storeChallenge(challenge: string, type: "registration" | "authentication") {
  // Clean up expired challenges first
  await prisma.webAuthnChallenge.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  await prisma.webAuthnChallenge.create({
    data: {
      challenge,
      type,
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
}

/** Consume a challenge (look up + delete). Returns null if not found or expired. */
export async function consumeChallenge(challenge: string, type: "registration" | "authentication"): Promise<string | null> {
  const row = await prisma.webAuthnChallenge.findFirst({
    where: { challenge, type, expiresAt: { gt: new Date() } },
  });
  if (!row) return null;
  await prisma.webAuthnChallenge.delete({ where: { id: row.id } });
  return row.challenge;
}
