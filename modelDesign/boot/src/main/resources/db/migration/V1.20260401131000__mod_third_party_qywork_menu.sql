INSERT INTO "menu" (
  "id",
  "parentId",
  "name",
  "title",
  "iconType",
  "iconValue",
  "path",
  "sort",
  "status",
  "nodeType",
  "createTime",
  "updateTime"
)
VALUES (
  8,
  4,
  '/system/third-party/qywork',
  '企业微信配置',
  'mdi',
  'mdi:wechat',
  '/system/third-party/qywork',
  300,
  1,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
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

SELECT setval(
  pg_get_serial_sequence('"menu"', 'id'),
  GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "menu"), 1),
  true
);
