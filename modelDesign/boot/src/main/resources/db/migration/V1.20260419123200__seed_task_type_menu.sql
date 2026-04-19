/**
 * 新增任务类型管理菜单。
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
    '/project/task-type',
    '任务类型',
    'none',
    '',
    '/project/task-type',
    35,
    1,
    0
FROM public.menu parent
WHERE parent.name = '/project'
  AND NOT EXISTS (
    SELECT 1
    FROM public.menu existing
    WHERE existing.name = '/project/task-type'
  );

UPDATE public.menu
SET
    "parentId" = (
        SELECT id
        FROM public.menu
        WHERE name = '/project'
        LIMIT 1
    ),
    title = '任务类型',
    "iconType" = 'none',
    "iconValue" = '',
    path = '/project/task-type',
    sort = 35,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/project/task-type';
