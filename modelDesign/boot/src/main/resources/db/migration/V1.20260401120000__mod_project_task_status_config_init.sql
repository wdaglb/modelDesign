CREATE TABLE IF NOT EXISTS "taskStatusConfig" (
  "id" bigserial PRIMARY KEY,
  "code" varchar(32) NOT NULL,
  "name" varchar(64) NOT NULL,
  "sort" integer NOT NULL,
  "isCompleted" boolean NOT NULL DEFAULT FALSE,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "uk_taskStatusConfig_code_lower" ON "taskStatusConfig" ((LOWER("code")));
CREATE UNIQUE INDEX IF NOT EXISTS "uk_taskStatusConfig_name_lower" ON "taskStatusConfig" ((LOWER("name")));
CREATE INDEX IF NOT EXISTS "idx_taskStatusConfig_sort" ON "taskStatusConfig" ("sort");

INSERT INTO "taskStatusConfig" ("code", "name", "sort", "isCompleted")
SELECT "defaultStatus"."code", "defaultStatus"."name", "defaultStatus"."sort", "defaultStatus"."isCompleted"
FROM (
  VALUES
    ('todo', '待处理', 1, FALSE),
    ('inProgress', '进行中', 2, FALSE),
    ('done', '已完成', 3, TRUE),
    ('canceled', '已取消', 4, FALSE)
) AS "defaultStatus" ("code", "name", "sort", "isCompleted")
WHERE NOT EXISTS (
  SELECT 1
  FROM "taskStatusConfig"
);
