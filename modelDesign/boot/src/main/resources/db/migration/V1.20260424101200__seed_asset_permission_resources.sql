/**
 * 新增设备库存管理权限资源，并赋予现有管理员默认权限。
 */

WITH menu_seed(parent_name, name, title, node_type, sort) AS (
    VALUES
        ('/asset/device', '/asset/device/manage', '管理设备台账', 1, 100),
        ('/asset/device', '/asset/device/receive', '领用设备', 1, 110),
        ('/asset/device', '/asset/device/return', '归还设备', 1, 120),
        ('/asset/device', '/asset/device/transfer', '调拨设备', 1, 130),
        ('/asset/device', '/asset/device/scrap', '报废设备', 1, 140),
        ('/asset/location', '/asset/location/manage', '管理位置', 1, 100),
        ('/asset/stocktake', '/asset/stocktake/manage', '管理盘点任务', 1, 100)
),
resolved_seed AS (
    SELECT
        parent.id AS parent_id,
        seed.name,
        seed.title,
        seed.node_type,
        seed.sort
    FROM menu_seed seed
    INNER JOIN public.menu parent
        ON parent.name = seed.parent_name
)
INSERT INTO public.menu (
    "parentId",
    name,
    title,
    "nodeType",
    "iconType",
    "iconValue",
    path,
    sort,
    status
)
SELECT
    resolved_seed.parent_id,
    resolved_seed.name,
    resolved_seed.title,
    resolved_seed.node_type,
    'none',
    '',
    resolved_seed.name,
    resolved_seed.sort,
    1
FROM resolved_seed
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu existing
    WHERE existing.name = resolved_seed.name
);

UPDATE public.menu
SET
    "nodeType" = 1,
    path = name,
    status = 1,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name IN (
    '/asset/device/manage',
    '/asset/device/receive',
    '/asset/device/return',
    '/asset/device/transfer',
    '/asset/device/scrap',
    '/asset/location/manage',
    '/asset/stocktake/manage'
);

INSERT INTO public.casbin_rule (ptype, v0, v1, v2, v3)
SELECT
    'p',
    role.code,
    role."tenantId"::character varying,
    'menu',
    menu.name
FROM public.role role
INNER JOIN public.menu menu
    ON menu.name IN (
        '/asset',
        '/asset/device',
        '/asset/location',
        '/asset/stocktake',
        '/asset/device/manage',
        '/asset/device/receive',
        '/asset/device/return',
        '/asset/device/transfer',
        '/asset/device/scrap',
        '/asset/location/manage',
        '/asset/stocktake/manage'
    )
WHERE (
        role."tenantId" = 1
        AND role.code IN ('super', 'admin')
    )
   OR role.code = 'tenant'
  AND NOT EXISTS (
      SELECT 1
      FROM public.casbin_rule existing
      WHERE existing.ptype = 'p'
        AND existing.v0 = role.code
        AND existing.v1 = role."tenantId"::character varying
        AND existing.v2 = 'menu'
        AND existing.v3 = menu.name
  );
