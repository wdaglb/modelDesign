CREATE TABLE IF NOT EXISTS "role" (
  "id" bigserial PRIMARY KEY,
  "name" varchar(64) NOT NULL,
  "code" varchar(64) NOT NULL,
  "remark" varchar(255) NOT NULL DEFAULT '',
  "sort" integer NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 1,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_role_code" UNIQUE ("code")
);

INSERT INTO "menu" ("id", "parentId", "name", "title", "iconType", "iconValue", "path", "sort", "status", "nodeType", "createTime", "updateTime")
VALUES (6, 4, '/system/role', '角色管理', 'mdi', 'mdi:account-key-outline', '/system/role', 2, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "parentId" = EXCLUDED."parentId",
  "name" = EXCLUDED."name",
  "title" = EXCLUDED."title",
  "iconType" = EXCLUDED."iconType",
  "iconValue" = EXCLUDED."iconValue",
  "path" = EXCLUDED."path",
  "sort" = EXCLUDED."sort",
  "status" = EXCLUDED."status",
  "nodeType" = EXCLUDED."nodeType",
  "updateTime" = CURRENT_TIMESTAMP;

SELECT setval(pg_get_serial_sequence('"menu"', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "menu"), 1), true);
SELECT setval(pg_get_serial_sequence('"role"', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "role"), 1), true);
