CREATE TABLE IF NOT EXISTS "projectTaskChangeLog" (
  "id" bigserial PRIMARY KEY,
  "taskId" bigint NOT NULL,
  "operationType" varchar(32) NOT NULL,
  "operatorId" bigint NOT NULL,
  "content" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_projectTaskChangeLog_taskId_createTime"
  ON "projectTaskChangeLog" ("taskId", "createTime" DESC);

CREATE INDEX IF NOT EXISTS "idx_projectTaskChangeLog_operatorId"
  ON "projectTaskChangeLog" ("operatorId");
