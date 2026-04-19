/**
 * 新增任务类型管理权限资源，并赋予现有管理员默认权限。
 */

WITH menu_seed(parent_name, name, title, node_type, sort) AS (
    VALUES
        ('/project/task-type', '/project/task-type/manage', '管理任务类型', 1, 100)
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
    "parentId" = (
        SELECT id
        FROM public.menu
        WHERE name = '/project/task-type'
        LIMIT 1
    ),
    title = '管理任务类型',
    "nodeType" = 1,
    path = '/project/task-type/manage',
    sort = 100,
    status = 1,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/project/task-type/manage';

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
        '/project/task-type',
        '/project/task-type/manage'
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
        '/project/task-type',
        '/project/task-type/manage'
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
