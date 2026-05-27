/**
 * 新增任务状态管理菜单，并把既有保存权限资源挂载到菜单下。
 *
 * 设计意图：
 * 1. 前端已经接入 `/project/task-status` 路由，需要在菜单树中补齐入口。
 * 2. `/project/task-status/save` 资源已存在于旧权限迁移中，本次只调整其父节点，
 *    避免页面菜单和按钮权限散落在 `/project` 根节点下。
 * 3. 默认继续为平台管理员、租户管理员补齐菜单与按钮资源授权，保持与任务类型页一致。
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
    parent.id,
    '/project/task-status',
    '任务状态',
    'none',
    '',
    '/project/task-status',
    34,
    1,
    0
FROM public.menu parent
WHERE parent.name = '/project'
  AND NOT EXISTS (
    SELECT 1
    FROM public.menu existing
    WHERE existing.name = '/project/task-status'
  );

UPDATE public.menu
SET
    "parentId" = (
        SELECT id
        FROM public.menu
        WHERE name = '/project'
        LIMIT 1
    ),
    title = '任务状态',
    "iconType" = 'none',
    "iconValue" = '',
    path = '/project/task-status',
    sort = 34,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/project/task-status';

UPDATE public.menu
SET
    "parentId" = (
        SELECT id
        FROM public.menu
        WHERE name = '/project/task-status'
        LIMIT 1
    ),
    title = '保存任务状态配置',
    "nodeType" = 1,
    path = '/project/task-status/save',
    sort = 100,
    status = 1,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/project/task-status/save';

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
        '/project/task-status',
        '/project/task-status/save'
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
        '/project/task-status',
        '/project/task-status/save'
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
