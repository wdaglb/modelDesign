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
  9,
  4,
  '/system/tenant',
  '租户管理',
  'mdi',
  'mdi:domain',
  '/system/tenant',
  3,
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
