CREATE TABLE IF NOT EXISTS "projectTask" (
  "id" bigserial PRIMARY KEY,
  "projectId" bigint NOT NULL,
  "title" varchar(128) NOT NULL,
  "description" text DEFAULT '',
  "status" varchar(32) NOT NULL,
  "priority" varchar(32) NOT NULL,
  "creatorId" bigint NOT NULL,
  "assigneeId" bigint,
  "startTime" timestamp,
  "dueTime" timestamp,
  "deleted" smallint NOT NULL DEFAULT 0,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_projectTask_projectId_deleted_updateTime" ON "projectTask" ("projectId", "deleted", "updateTime");
CREATE INDEX IF NOT EXISTS "idx_projectTask_projectId_status" ON "projectTask" ("projectId", "status");
CREATE INDEX IF NOT EXISTS "idx_projectTask_assigneeId" ON "projectTask" ("assigneeId");

CREATE TABLE IF NOT EXISTS "projectTaskMember" (
  "id" bigserial PRIMARY KEY,
  "taskId" bigint NOT NULL,
  "userId" bigint NOT NULL,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_projectTaskMember_task_user" UNIQUE ("taskId", "userId")
);

CREATE INDEX IF NOT EXISTS "idx_projectTaskMember_taskId" ON "projectTaskMember" ("taskId");
CREATE INDEX IF NOT EXISTS "idx_projectTaskMember_userId" ON "projectTaskMember" ("userId");
