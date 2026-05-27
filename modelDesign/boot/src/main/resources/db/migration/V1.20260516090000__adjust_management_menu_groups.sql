/**
 * 调整管理类菜单分组名称，并为项目列表页补充独立子菜单。
 *
 * 设计意图：
 * 1. `/project` 原本既是父级分组也是项目列表页入口，新增任务类型、任务状态后，
 *    前端菜单会把它渲染为父级菜单，点击语义容易和展开语义冲突。
 * 2. 保留 `/project` 作为父级资源，避免既有角色、权限组和按钮资源失效；
 *    新增 `/project/list` 作为“项目管理”子菜单，path 仍指向 `/project`。
 * 3. 仅调整菜单展示标题，不改变库存、系统等已有资源标识和接口权限。
 */

UPDATE public.menu
SET
    title = '项目',
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/project'
  AND "nodeType" = 0;

UPDATE public.menu
SET
    title = '库存',
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/asset'
  AND "nodeType" = 0;

UPDATE public.menu
SET
    title = '系统',
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/system'
  AND "nodeType" = 0;

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
    '/project/list',
    '项目管理',
    'none',
    '',
    '/project',
    10,
    1,
    0
FROM public.menu parent
WHERE parent.name = '/project'
  AND NOT EXISTS (
    SELECT 1
    FROM public.menu existing
    WHERE existing.name = '/project/list'
  );

UPDATE public.menu
SET
    "parentId" = (
        SELECT id
        FROM public.menu
        WHERE name = '/project'
        LIMIT 1
    ),
    title = '项目管理',
    "iconType" = 'none',
    "iconValue" = '',
    path = '/project',
    sort = 10,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/project/list';

INSERT INTO public.casbin_rule (ptype, v0, v1, v2, v3)
SELECT
    'p',
    role.code,
    role."tenantId"::character varying,
    'menu',
    '/project/list'
FROM public.role role
WHERE role."tenantId" = 1
  AND role.code IN ('super', 'admin')
  AND NOT EXISTS (
    SELECT 1
    FROM public.casbin_rule existing
    WHERE existing.ptype = 'p'
      AND existing.v0 = role.code
      AND existing.v1 = role."tenantId"::character varying
      AND existing.v2 = 'menu'
      AND existing.v3 = '/project/list'
  );

INSERT INTO public.casbin_rule (ptype, v0, v1, v2, v3)
SELECT
    'p',
    role.code,
    role."tenantId"::character varying,
    'menu',
    '/project/list'
FROM public.role role
WHERE role."tenantId" <> 1
  AND role.code = 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM public.casbin_rule existing
    WHERE existing.ptype = 'p'
      AND existing.v0 = role.code
      AND existing.v1 = role."tenantId"::character varying
      AND existing.v2 = 'menu'
      AND existing.v3 = '/project/list'
  );
