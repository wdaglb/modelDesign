/**
 * 新增敏捷面板内任务迭代管理权限资源。
 *
 * 迭代维护入口承载在敏捷面板弹窗内，因此这里只新增接口权限资源，
 * 不新增独立侧边菜单入口。
 */

WITH menu_seed(parent_name, name, title, node_type, sort) AS (
    VALUES
        ('/agile-board', '/project/task-iteration/list', '查看任务迭代', 1, 100),
        ('/agile-board', '/project/task-iteration/create', '创建任务迭代', 1, 110),
        ('/agile-board', '/project/task-iteration/edit', '编辑任务迭代', 1, 120),
        ('/agile-board', '/project/task-iteration/deleted', '删除任务迭代', 1, 130)
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
        WHERE name = '/agile-board'
        LIMIT 1
    ),
    "nodeType" = 1,
    "iconType" = 'none',
    "iconValue" = '',
    path = name,
    status = 1,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name IN (
    '/project/task-iteration/list',
    '/project/task-iteration/create',
    '/project/task-iteration/edit',
    '/project/task-iteration/deleted'
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
        '/project/task-iteration/list',
        '/project/task-iteration/create',
        '/project/task-iteration/edit',
        '/project/task-iteration/deleted'
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
        '/project/task-iteration/list',
        '/project/task-iteration/create',
        '/project/task-iteration/edit',
        '/project/task-iteration/deleted'
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
