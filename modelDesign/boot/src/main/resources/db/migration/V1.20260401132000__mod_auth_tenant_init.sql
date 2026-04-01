CREATE TABLE IF NOT EXISTS "tenant" (
  "id" bigserial PRIMARY KEY,
  "code" varchar(64) NOT NULL,
  "name" varchar(64) NOT NULL,
  "description" varchar(255) NOT NULL DEFAULT '',
  "status" smallint NOT NULL DEFAULT 1,
  "deleted" smallint NOT NULL DEFAULT 0,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "uk_tenant_code_active"
  ON "tenant" ((LOWER("code")))
  WHERE "deleted" = 0;

CREATE INDEX IF NOT EXISTS "idx_tenant_deleted_updateTime"
  ON "tenant" ("deleted", "updateTime");

INSERT INTO "tenant" (
  "id",
  "code",
  "name",
  "description",
  "status",
  "deleted",
  "createTime",
  "updateTime"
)
VALUES (
  1,
  'default',
  '默认租户',
  '平台超级管理员默认租户',
  1,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "status" = EXCLUDED."status",
  "deleted" = EXCLUDED."deleted",
  "updateTime" = CURRENT_TIMESTAMP;

SELECT setval(
  pg_get_serial_sequence('"tenant"', 'id'),
  GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "tenant"), 1),
  true
);
