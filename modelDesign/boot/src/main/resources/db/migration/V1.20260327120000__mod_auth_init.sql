CREATE TABLE IF NOT EXISTS "user" (
  "id" bigserial PRIMARY KEY,
  "username" varchar(64) NOT NULL,
  "passwordHash" varchar(255) NOT NULL,
  "nickname" varchar(64) NOT NULL,
  "avatarId" varchar(64) DEFAULT '',
  "status" smallint NOT NULL DEFAULT 1,
  "lastLoginIp" varchar(64) DEFAULT '',
  "lastLoginTime" timestamp NULL,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_user_username" UNIQUE ("username")
);

CREATE TABLE IF NOT EXISTS "menu" (
  "id" bigserial PRIMARY KEY,
  "parentId" bigint NOT NULL DEFAULT 0,
  "name" varchar(100) NOT NULL,
  "title" varchar(100) NOT NULL,
  "iconType" varchar(32) NOT NULL DEFAULT 'mdi',
  "iconValue" varchar(100) NOT NULL DEFAULT '',
  "path" varchar(200) NOT NULL DEFAULT '',
  "sort" integer NOT NULL DEFAULT 0,
  "status" smallint NOT NULL DEFAULT 1,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "user" ("id", "username", "passwordHash", "nickname", "avatarId", "status", "lastLoginIp", "lastLoginTime", "createTime", "updateTime")
VALUES (1, 'admin', '$2y$10$W1lPPFUUWZG1zN1sRZZ8GeJtFbMgkTnYrV/2hzz00k1IzYSETmStG', '超级管理员', '', 1, '', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("username") DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  "nickname" = EXCLUDED."nickname",
  "status" = EXCLUDED."status",
  "updateTime" = CURRENT_TIMESTAMP;

SELECT setval(pg_get_serial_sequence('"user"', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "user"), 1), true);

INSERT INTO "menu" ("id", "parentId", "name", "title", "iconType", "iconValue", "path", "sort", "status", "createTime", "updateTime")
VALUES
  (1, 0, '/ai', 'AI', 'mdi', 'mdi:robot-outline', '/ai', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 1, '/ai/chat', 'AI 对话', 'mdi', 'mdi:chat-processing-outline', '/ai/chat', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 0, '/project', '项目管理', 'mdi', 'mdi:folder-outline', '/project', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 0, '/system', '系统管理', 'mdi', 'mdi:cog-outline', '/system', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (5, 4, '/system/menu', '菜单管理', 'mdi', 'mdi:shield-outline', '/system/menu', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "parentId" = EXCLUDED."parentId",
  "name" = EXCLUDED."name",
  "title" = EXCLUDED."title",
  "iconType" = EXCLUDED."iconType",
  "iconValue" = EXCLUDED."iconValue",
  "path" = EXCLUDED."path",
  "sort" = EXCLUDED."sort",
  "status" = EXCLUDED."status",
  "updateTime" = CURRENT_TIMESTAMP;

SELECT setval(pg_get_serial_sequence('"menu"', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "menu"), 1), true);

