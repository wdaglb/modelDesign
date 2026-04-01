ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "tenantId" bigint NOT NULL DEFAULT 1;

UPDATE "user"
SET "tenantId" = 1
WHERE "tenantId" IS NULL;
