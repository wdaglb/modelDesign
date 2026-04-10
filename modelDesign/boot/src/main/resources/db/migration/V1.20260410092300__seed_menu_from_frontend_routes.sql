/*
 * 根据 2026-04-10 当前前端稳定路由生成后台菜单初始化数据。
 * 当前迁移默认排除登录页、首页占位页、个人中心与项目动态详情页：
 * 1. `/login` 属于公共登录入口，不应出现在后台导航菜单。
 * 2. `/` 当前仍是占位页，不适合作为正式菜单。
 * 3. `/personal-center` 已通过右上角用户入口访问，不走侧边菜单。
 * 4. `/project/$projectId*` 属于业务内页，路径含动态参数，不适合初始化为固定菜单。
 * `name` 字段同时承担权限键与前端跳转路径，因此本迁移按 `name` 做幂等同步。
 */

/*
 * 顶级菜单：我的待办
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
    '/my-todo',
    '我的待办',
    'mdi',
    'mdi:clipboard-text-clock-outline',
    '/my-todo',
    10,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/my-todo'
);

UPDATE public.menu
SET
    "parentId" = 0,
    title = '我的待办',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:clipboard-text-clock-outline',
    path = '/my-todo',
    sort = 10,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/my-todo';

/*
 * 顶级菜单：敏捷看板
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
    '/agile-board',
    '敏捷看板',
    'mdi',
    'mdi:view-kanban-outline',
    '/agile-board',
    20,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/agile-board'
);

UPDATE public.menu
SET
    "parentId" = 0,
    title = '敏捷看板',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:view-kanban-outline',
    path = '/agile-board',
    sort = 20,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/agile-board';

/*
 * 顶级菜单：项目管理
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
    '/project',
    '项目管理',
    'mdi',
    'mdi:folder-multiple-outline',
    '/project',
    30,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/project'
);

UPDATE public.menu
SET
    "parentId" = 0,
    title = '项目管理',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:folder-multiple-outline',
    path = '/project',
    sort = 30,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/project';

/*
 * 顶级菜单：AI 对话
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
    '/ai/chat',
    'AI 对话',
    'mdi',
    'mdi:robot-outline',
    '/ai/chat',
    40,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/ai/chat'
);

UPDATE public.menu
SET
    "parentId" = 0,
    title = 'AI 对话',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:robot-outline',
    path = '/ai/chat',
    sort = 40,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/ai/chat';

/*
 * 顶级分组：系统管理。
 * 当前前端没有 `/system` 实际路由，但侧边栏可将该节点作为分组使用。
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
    '/system',
    '系统管理',
    'mdi',
    'mdi:cog-outline',
    '/system',
    90,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/system'
);

UPDATE public.menu
SET
    "parentId" = 0,
    title = '系统管理',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:cog-outline',
    path = '/system',
    sort = 90,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/system';

/*
 * 系统管理子菜单：用户管理
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
    COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    '/system/user',
    '用户管理',
    'mdi',
    'mdi:account-outline',
    '/system/user',
    10,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/system/user'
);

UPDATE public.menu
SET
    "parentId" = COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    title = '用户管理',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:account-outline',
    path = '/system/user',
    sort = 10,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/system/user';

/*
 * 系统管理子菜单：角色管理
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
    COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    '/system/role',
    '角色管理',
    'mdi',
    'mdi:shield-account-outline',
    '/system/role',
    20,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/system/role'
);

UPDATE public.menu
SET
    "parentId" = COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    title = '角色管理',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:shield-account-outline',
    path = '/system/role',
    sort = 20,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/system/role';

/*
 * 系统管理子菜单：职位管理
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
    COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    '/system/position',
    '职位管理',
    'mdi',
    'mdi:badge-account-horizontal-outline',
    '/system/position',
    30,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/system/position'
);

UPDATE public.menu
SET
    "parentId" = COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    title = '职位管理',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:badge-account-horizontal-outline',
    path = '/system/position',
    sort = 30,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/system/position';

/*
 * 系统管理子菜单：租户管理
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
    COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    '/system/tenant',
    '租户管理',
    'mdi',
    'mdi:domain',
    '/system/tenant',
    40,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/system/tenant'
);

UPDATE public.menu
SET
    "parentId" = COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    title = '租户管理',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:domain',
    path = '/system/tenant',
    sort = 40,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/system/tenant';

/*
 * 系统管理子菜单：菜单管理
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
    COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    '/system/menu',
    '菜单管理',
    'mdi',
    'mdi:menu-open',
    '/system/menu',
    50,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/system/menu'
);

UPDATE public.menu
SET
    "parentId" = COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    title = '菜单管理',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:menu-open',
    path = '/system/menu',
    sort = 50,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/system/menu';

/*
 * 系统管理分组：第三方集成。
 * 当前前端没有 `/system/third-party` 实际路由，但该节点用于承接第三方配置子菜单。
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
    COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    '/system/third-party',
    '第三方集成',
    'mdi',
    'mdi:application-cog-outline',
    '/system/third-party',
    60,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/system/third-party'
);

UPDATE public.menu
SET
    "parentId" = COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    title = '第三方集成',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:application-cog-outline',
    path = '/system/third-party',
    sort = 60,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/system/third-party';

/*
 * 第三方集成子菜单：企业微信配置
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
    COALESCE((SELECT id FROM public.menu WHERE name = '/system/third-party'), 0),
    '/system/third-party/qywork',
    '企业微信配置',
    'mdi',
    'mdi:wechat',
    '/system/third-party/qywork',
    10,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/system/third-party/qywork'
);

UPDATE public.menu
SET
    "parentId" = COALESCE((SELECT id FROM public.menu WHERE name = '/system/third-party'), 0),
    title = '企业微信配置',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:wechat',
    path = '/system/third-party/qywork',
    sort = 10,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/system/third-party/qywork';
