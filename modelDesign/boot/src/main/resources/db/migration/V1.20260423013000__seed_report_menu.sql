/*
 * 顶级菜单：报表生成
 *
 * 当前 `/report` 为固定页面路由，适合作为侧边栏一级菜单。
 * `name` 同时承担权限键与前端路径，因此按 `name` 做幂等同步。
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
    '/report',
    '报表生成',
    'mdi',
    'mdi:file-chart-outline',
    '/report',
    50,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/report'
);

UPDATE public.menu
SET
    "parentId" = 0,
    title = '报表生成',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:file-chart-outline',
    path = '/report',
    sort = 50,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/report';
