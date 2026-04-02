ALTER TABLE "project"
  ADD COLUMN IF NOT EXISTS "status" varchar(32) NOT NULL DEFAULT 'planning',
  ADD COLUMN IF NOT EXISTS "projectGroup" varchar(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "progressSummary" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "completedModuleCount" integer NOT NULL DEFAULT 0;

UPDATE "project"
SET "status" = 'planning'
WHERE "status" IS NULL OR "status" = '';

UPDATE "project"
SET "projectGroup" = ''
WHERE "projectGroup" IS NULL;

UPDATE "project"
SET "progressSummary" = ''
WHERE "progressSummary" IS NULL;

UPDATE "project"
SET "completedModuleCount" = 0
WHERE "completedModuleCount" IS NULL OR "completedModuleCount" < 0;

CREATE INDEX IF NOT EXISTS "idx_project_deleted_status_updateTime"
  ON "project" ("deleted", "status", "updateTime");
