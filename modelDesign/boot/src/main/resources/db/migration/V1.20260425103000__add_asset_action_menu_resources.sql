/**
 * 补充库存管理动作级菜单资源。
 *
 * 该迁移只追加和校准按钮/动作级资源，不改变页面级菜单结构。
 * 入库、编辑、盘点登记和完成盘点需要作为可分配资源进入菜单树，
 * 否则后续角色权限配置无法对这些动作做细粒度授权。
 */

WITH menu_seed(parent_name, name, title, node_type, sort) AS (
    VALUES
        ('/asset/device', '/asset/device/create', '入库登记', 1, 90),
        ('/asset/device', '/asset/device/manage', '管理设备台账', 1, 100),
        ('/asset/device', '/asset/device/edit', '编辑设备', 1, 105),
        ('/asset/device', '/asset/device/receive', '领用设备', 1, 110),
        ('/asset/device', '/asset/device/return', '归还设备', 1, 120),
        ('/asset/device', '/asset/device/transfer', '调拨设备', 1, 130),
        ('/asset/device', '/asset/device/scrap', '报废设备', 1, 140),
        ('/asset/stocktake', '/asset/stocktake/check', '盘点登记', 1, 110),
        ('/asset/stocktake', '/asset/stocktake/complete', '完成盘点', 1, 120)
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

WITH menu_seed(parent_name, name, title, node_type, sort) AS (
    VALUES
        ('/asset/device', '/asset/device/create', '入库登记', 1, 90),
        ('/asset/device', '/asset/device/manage', '管理设备台账', 1, 100),
        ('/asset/device', '/asset/device/edit', '编辑设备', 1, 105),
        ('/asset/device', '/asset/device/receive', '领用设备', 1, 110),
        ('/asset/device', '/asset/device/return', '归还设备', 1, 120),
        ('/asset/device', '/asset/device/transfer', '调拨设备', 1, 130),
        ('/asset/device', '/asset/device/scrap', '报废设备', 1, 140),
        ('/asset/stocktake', '/asset/stocktake/check', '盘点登记', 1, 110),
        ('/asset/stocktake', '/asset/stocktake/complete', '完成盘点', 1, 120)
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
UPDATE public.menu
SET
    "parentId" = resolved_seed.parent_id,
    title = resolved_seed.title,
    "nodeType" = resolved_seed.node_type,
    "iconType" = 'none',
    "iconValue" = '',
    path = resolved_seed.name,
    sort = resolved_seed.sort,
    status = 1,
    "updateTime" = CURRENT_TIMESTAMP
FROM resolved_seed
WHERE public.menu.name = resolved_seed.name;

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
        '/asset/device/create',
        '/asset/device/edit',
        '/asset/stocktake/check',
        '/asset/stocktake/complete'
    )
WHERE role."tenantId" = 1
  AND role.code IN ('super', 'admin')
  AND NOT EXISTS (
    SELECT 1
    FROM public.casbin_rule existing
    WHERE existing.ptype = 'p'
      AND existing.v0 = role.code
      AND existing.v1 = role."tenantId"::character varying
      AND existing.v2 = 'menu'
      AND existing.v3 = menu.name
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
        '/asset/device/create',
        '/asset/device/edit',
        '/asset/stocktake/check',
        '/asset/stocktake/complete'
    )
WHERE role.code = 'tenant'
  AND NOT EXISTS (
    SELECT 1
    FROM public.casbin_rule existing
    WHERE existing.ptype = 'p'
      AND existing.v0 = role.code
      AND existing.v1 = role."tenantId"::character varying
      AND existing.v2 = 'menu'
      AND existing.v3 = menu.name
  );
