CREATE TABLE IF NOT EXISTS "position" (
  "id" bigserial PRIMARY KEY,
  "tenantId" bigint NOT NULL,
  "name" varchar(64) NOT NULL,
  "code" varchar(64) NOT NULL,
  "remark" varchar(255) NOT NULL DEFAULT '',
  "sort" integer NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 1,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_position_tenant_code" UNIQUE ("tenantId", "code")
);

CREATE INDEX IF NOT EXISTS "idx_position_tenantId" ON "position" ("tenantId");
CREATE INDEX IF NOT EXISTS "idx_position_tenant_status" ON "position" ("tenantId", "status");
CREATE INDEX IF NOT EXISTS "idx_position_tenant_updateTime" ON "position" ("tenantId", "updateTime");

CREATE TABLE IF NOT EXISTS "userPosition" (
  "id" bigserial PRIMARY KEY,
  "userId" bigint NOT NULL,
  "positionId" bigint NOT NULL,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_userPosition_user_position" UNIQUE ("userId", "positionId")
);

CREATE INDEX IF NOT EXISTS "idx_userPosition_userId" ON "userPosition" ("userId");
CREATE INDEX IF NOT EXISTS "idx_userPosition_positionId" ON "userPosition" ("positionId");

SELECT setval(
  pg_get_serial_sequence('"position"', 'id'),
  GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "position"), 1),
  true
);

SELECT setval(
  pg_get_serial_sequence('"userPosition"', 'id'),
  GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "userPosition"), 1),
  true
);
