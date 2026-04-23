/**
 * 新增设备库存管理菜单。
 */

INSERT INTO public.menu (
    "parentId",
    name,
    title,
    "iconType",
    "iconValue",
    path,
    sort,
    status,
    "nodeType"
)
SELECT
    0,
    '/asset',
    '库存管理',
    'mdi',
    'mdi:package-variant-closed',
    '/asset/device',
    60,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu existing
    WHERE existing.name = '/asset'
);

UPDATE public.menu
SET
    "parentId" = 0,
    title = '库存管理',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:package-variant-closed',
    path = '/asset/device',
    sort = 60,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/asset';

WITH menu_seed(parent_name, name, title, sort) AS (
    VALUES
        ('/asset', '/asset/device', '设备台账', 10),
        ('/asset', '/asset/location', '位置管理', 20),
        ('/asset', '/asset/stocktake', '盘点任务', 30)
)
INSERT INTO public.menu (
    "parentId",
    name,
    title,
    "iconType",
    "iconValue",
    path,
    sort,
    status,
    "nodeType"
)
SELECT
    parent.id,
    seed.name,
    seed.title,
    'none',
    '',
    seed.name,
    seed.sort,
    1,
    0
FROM menu_seed seed
INNER JOIN public.menu parent
    ON parent.name = seed.parent_name
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu existing
    WHERE existing.name = seed.name
);

UPDATE public.menu
SET
    "parentId" = (SELECT id FROM public.menu WHERE name = '/asset' LIMIT 1),
    "iconType" = 'none',
    "iconValue" = '',
    path = name,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name IN ('/asset/device', '/asset/location', '/asset/stocktake');
