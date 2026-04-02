ALTER TABLE "projectTask"
    ADD COLUMN IF NOT EXISTS "parentTaskId" bigint;

CREATE INDEX IF NOT EXISTS "idx_projectTask_parentTaskId"
    ON "projectTask" ("parentTaskId");

CREATE TABLE IF NOT EXISTS "projectTaskDependency" (
    "id" bigserial PRIMARY KEY,
    "taskId" bigint NOT NULL,
    "predecessorTaskId" bigint NOT NULL,
    "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uk_projectTaskDependency_task_predecessor" UNIQUE ("taskId", "predecessorTaskId")
);

CREATE INDEX IF NOT EXISTS "idx_projectTaskDependency_taskId"
    ON "projectTaskDependency" ("taskId");

CREATE INDEX IF NOT EXISTS "idx_projectTaskDependency_predecessorTaskId"
    ON "projectTaskDependency" ("predecessorTaskId");

CREATE TABLE IF NOT EXISTS "taskTag" (
    "id" bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    "name" varchar(64) NOT NULL,
    "color" varchar(32) NOT NULL DEFAULT '',
    "sort" integer NOT NULL DEFAULT 0,
    "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uk_taskTag_tenant_name" UNIQUE ("tenantId", "name")
);

CREATE INDEX IF NOT EXISTS "idx_taskTag_tenant_sort"
    ON "taskTag" ("tenantId", "sort");

CREATE TABLE IF NOT EXISTS "projectTaskTag" (
    "id" bigserial PRIMARY KEY,
    "taskId" bigint NOT NULL,
    "tagId" bigint NOT NULL,
    "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uk_projectTaskTag_task_tag" UNIQUE ("taskId", "tagId")
);

CREATE INDEX IF NOT EXISTS "idx_projectTaskTag_taskId"
    ON "projectTaskTag" ("taskId");

CREATE INDEX IF NOT EXISTS "idx_projectTaskTag_tagId"
    ON "projectTaskTag" ("tagId");
