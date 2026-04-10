/**
 * One-time script: backfill all orphaned rows (userId = null) to the owner's user ID.
 *
 * Run AFTER the owner has signed in with Google for the first time.
 *
 * Usage:
 *   OWNER_USER_ID=<id_from_user_table> npx tsx scripts/backfill-owner.ts
 *
 * To find the owner's user ID, run in your DB console:
 *   SELECT id, email FROM "user" WHERE email = '<your-email>';
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ownerId = process.env.OWNER_USER_ID;
  if (!ownerId) {
    console.error("Error: OWNER_USER_ID env var is required.");
    console.error('Run: SELECT id FROM "user" WHERE email = \'<your-email>\';');
    process.exit(1);
  }

  // Verify user exists
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) {
    console.error(`Error: No user found with id "${ownerId}"`);
    process.exit(1);
  }

  console.log(`Backfilling data for owner: ${owner.email} (${owner.id})`);

  const sessions = await prisma.session.updateMany({
    where: { userId: null },
    data: { userId: ownerId },
  });
  console.log(`  Sessions backfilled: ${sessions.count}`);

  const prefs = await prisma.userPreferences.updateMany({
    where: { userId: null },
    data: { userId: ownerId },
  });
  console.log(`  UserPreferences backfilled: ${prefs.count}`);

  const extras = await prisma.extrasConfig.updateMany({
    where: { userId: null },
    data: { userId: ownerId },
  });
  console.log(`  ExtrasConfig backfilled: ${extras.count}`);

  const plans = await prisma.plan.updateMany({
    where: { userId: null, builtIn: false },
    data: { userId: ownerId },
  });
  console.log(`  Custom plans backfilled: ${plans.count}`);

  console.log("Done. All existing data is now associated with the owner account.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
