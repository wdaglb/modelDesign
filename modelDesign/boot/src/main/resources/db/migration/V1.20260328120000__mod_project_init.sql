CREATE TABLE IF NOT EXISTS "project" (
  "id" bigserial PRIMARY KEY,
  "code" varchar(64) NOT NULL,
  "name" varchar(128) NOT NULL,
  "description" text DEFAULT '',
  "dbType" varchar(32) NOT NULL,
  "creatorId" bigint NOT NULL,
  "deleted" smallint NOT NULL DEFAULT 0,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_project_code" UNIQUE ("code")
);

CREATE INDEX IF NOT EXISTS "idx_project_deleted_updateTime" ON "project" ("deleted", "updateTime");

CREATE TABLE IF NOT EXISTS "projectMember" (
  "id" bigserial PRIMARY KEY,
  "projectId" bigint NOT NULL,
  "userId" bigint NOT NULL,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_projectMember_project_user" UNIQUE ("projectId", "userId")
);

CREATE INDEX IF NOT EXISTS "idx_projectMember_projectId" ON "projectMember" ("projectId");
CREATE INDEX IF NOT EXISTS "idx_projectMember_userId" ON "projectMember" ("userId");
