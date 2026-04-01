WITH "nextStatusConfig" ("code", "name", "sort", "isCompleted") AS (
  VALUES
    ('todo', '待执行', 1, FALSE),
    ('inProgress', '执行中', 2, FALSE),
    ('pendingTest', '待测试', 3, FALSE),
    ('pendingRelease', '待发布', 4, FALSE),
    ('done', '已完成', 5, TRUE),
    ('canceled', '已取消', 6, FALSE)
)
INSERT INTO "taskStatusConfig" ("code", "name", "sort", "isCompleted")
SELECT
  "nextStatusConfig"."code",
  "nextStatusConfig"."name",
  "nextStatusConfig"."sort",
  "nextStatusConfig"."isCompleted"
FROM "nextStatusConfig"
ON CONFLICT DO NOTHING;

WITH "nextStatusConfig" ("code", "name", "sort", "isCompleted") AS (
  VALUES
    ('todo', '待执行', 1, FALSE),
    ('inProgress', '执行中', 2, FALSE),
    ('pendingTest', '待测试', 3, FALSE),
    ('pendingRelease', '待发布', 4, FALSE),
    ('done', '已完成', 5, TRUE),
    ('canceled', '已取消', 6, FALSE)
)
UPDATE "taskStatusConfig" AS "currentStatusConfig"
SET
  "name" = "nextStatusConfig"."name",
  "sort" = "nextStatusConfig"."sort",
  "isCompleted" = "nextStatusConfig"."isCompleted",
  "updateTime" = CURRENT_TIMESTAMP
FROM "nextStatusConfig"
WHERE LOWER("currentStatusConfig"."code") = LOWER("nextStatusConfig"."code");
