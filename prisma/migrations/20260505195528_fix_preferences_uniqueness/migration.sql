-- UserPreferences: drop the literal-string default on `id`, dedupe rows by
-- userId (keep the most-recently-updated), and enforce one row per user.
ALTER TABLE "UserPreferences" ALTER COLUMN "id" DROP DEFAULT;

DELETE FROM "UserPreferences" a
USING "UserPreferences" b
WHERE a."userId" = b."userId"
  AND a."userId" IS NOT NULL
  AND a."updatedAt" < b."updatedAt";

CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- ExtrasConfig: same fix. No updatedAt column on this table, so dedupe by
-- ctid (Postgres physical row id) — arbitrary but stable for this purpose.
ALTER TABLE "ExtrasConfig" ALTER COLUMN "id" DROP DEFAULT;

DELETE FROM "ExtrasConfig" a
USING "ExtrasConfig" b
WHERE a."userId" = b."userId"
  AND a."userId" IS NOT NULL
  AND a.ctid < b.ctid;

CREATE UNIQUE INDEX "ExtrasConfig_userId_key" ON "ExtrasConfig"("userId");
