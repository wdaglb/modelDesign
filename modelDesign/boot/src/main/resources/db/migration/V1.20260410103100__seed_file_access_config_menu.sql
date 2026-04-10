/**
 * 系统管理新增文件访问配置菜单。
 * 同时将第三方集成菜单顺序后移，避免与新菜单冲突。
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
    '/system/file-config',
    '文件访问配置',
    'mdi',
    'mdi:link-variant',
    '/system/file-config',
    60,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/system/file-config'
);

UPDATE public.menu
SET
    "parentId" = COALESCE((SELECT id FROM public.menu WHERE name = '/system'), 0),
    title = '文件访问配置',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:link-variant',
    path = '/system/file-config',
    sort = 60,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/system/file-config';

UPDATE public.menu
SET
    sort = 70,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/system/third-party';
