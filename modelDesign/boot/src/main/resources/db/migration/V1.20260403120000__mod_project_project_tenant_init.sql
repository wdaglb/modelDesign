ALTER TABLE "project"
    ADD COLUMN IF NOT EXISTS "tenantId" bigint DEFAULT 1;

UPDATE "project" AS p
SET "tenantId" = u."tenantId"
FROM "user" AS u
WHERE p."creatorId" = u."id"
  AND p."tenantId" IS NULL;

UPDATE "project"
SET "tenantId" = 1
WHERE "tenantId" IS NULL;

ALTER TABLE "project"
    ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "project"
    DROP CONSTRAINT IF EXISTS "uk_project_code";

ALTER TABLE "project"
    ADD CONSTRAINT "uk_project_tenant_code" UNIQUE ("tenantId", "code");

CREATE INDEX IF NOT EXISTS "idx_project_tenantId"
    ON "project" ("tenantId");
