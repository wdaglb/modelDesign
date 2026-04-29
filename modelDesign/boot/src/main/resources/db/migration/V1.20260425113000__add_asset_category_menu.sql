/**
 * 新增设备分类管理菜单和权限资源。
 */

WITH parent_menu AS (
    SELECT id
    FROM public.menu
    WHERE name = '/asset'
    LIMIT 1
),
menu_seed(name, title, sort) AS (
    VALUES
        ('/asset/category', '分类管理', 15)
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
    parent_menu.id,
    menu_seed.name,
    menu_seed.title,
    'none',
    '',
    menu_seed.name,
    menu_seed.sort,
    1,
    0
FROM menu_seed
INNER JOIN parent_menu
    ON TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu existing
    WHERE existing.name = menu_seed.name
);

UPDATE public.menu
SET
    "parentId" = (SELECT id FROM public.menu WHERE name = '/asset' LIMIT 1),
    title = '分类管理',
    "iconType" = 'none',
    "iconValue" = '',
    path = '/asset/category',
    sort = 15,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/asset/category';

WITH parent_menu AS (
    SELECT id
    FROM public.menu
    WHERE name = '/asset/category'
    LIMIT 1
),
resource_seed(name, title, sort) AS (
    VALUES
        ('/asset/category/manage', '管理设备分类', 100)
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
    parent_menu.id,
    resource_seed.name,
    resource_seed.title,
    1,
    'none',
    '',
    resource_seed.name,
    resource_seed.sort,
    1
FROM resource_seed
INNER JOIN parent_menu
    ON TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu existing
    WHERE existing.name = resource_seed.name
);

UPDATE public.menu
SET
    "parentId" = (
        SELECT id
        FROM public.menu
        WHERE name = '/asset/category'
        LIMIT 1
    ),
    title = '管理设备分类',
    "nodeType" = 1,
    path = '/asset/category/manage',
    status = 1,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/asset/category/manage';

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
        '/asset/category',
        '/asset/category/manage'
    )
WHERE ((
        role."tenantId" = 1
        AND role.code IN ('super', 'admin')
    )
   OR role.code = 'tenant')
  AND NOT EXISTS (
      SELECT 1
      FROM public.casbin_rule existing
      WHERE existing.ptype = 'p'
        AND existing.v0 = role.code
        AND existing.v1 = role."tenantId"::character varying
        AND existing.v2 = 'menu'
        AND existing.v3 = menu.name
  );
