/*
 * 根据当前前后端任务流转约定初始化任务状态配置。
 * 当前迁移按 `code` 做幂等同步，避免重复插入，同时保证名称、
 * 排序和完成态标记与现有业务代码保持一致。
 *
 * 状态设计说明：
 * 1. `done` 是唯一完成状态，满足服务端“必须且只能有一个完成状态”的约束。
 * 2. `canceled` 保留为非完成状态，兼容前后端现有“已取消”筛选、展示与编辑逻辑。
 * 3. 排序顺序与当前任务流转顺序保持一致，便于看板与表单直接复用。
 */

/*
 * 状态：待执行
 */
INSERT INTO public."taskStatusConfig" (
    code,
    name,
    sort,
    "isCompleted"
)
SELECT
    'todo',
    '待执行',
    1,
    false
WHERE NOT EXISTS (
    SELECT 1
    FROM public."taskStatusConfig"
    WHERE LOWER(code) = LOWER('todo')
);

UPDATE public."taskStatusConfig"
SET
    name = '待执行',
    sort = 1,
    "isCompleted" = false,
    "updateTime" = CURRENT_TIMESTAMP
WHERE LOWER(code) = LOWER('todo');

/*
 * 状态：执行中
 */
INSERT INTO public."taskStatusConfig" (
    code,
    name,
    sort,
    "isCompleted"
)
SELECT
    'inProgress',
    '执行中',
    2,
    false
WHERE NOT EXISTS (
    SELECT 1
    FROM public."taskStatusConfig"
    WHERE LOWER(code) = LOWER('inProgress')
);

UPDATE public."taskStatusConfig"
SET
    name = '执行中',
    sort = 2,
    "isCompleted" = false,
    "updateTime" = CURRENT_TIMESTAMP
WHERE LOWER(code) = LOWER('inProgress');

/*
 * 状态：待测试
 */
INSERT INTO public."taskStatusConfig" (
    code,
    name,
    sort,
    "isCompleted"
)
SELECT
    'pendingTest',
    '待测试',
    3,
    false
WHERE NOT EXISTS (
    SELECT 1
    FROM public."taskStatusConfig"
    WHERE LOWER(code) = LOWER('pendingTest')
);

UPDATE public."taskStatusConfig"
SET
    name = '待测试',
    sort = 3,
    "isCompleted" = false,
    "updateTime" = CURRENT_TIMESTAMP
WHERE LOWER(code) = LOWER('pendingTest');

/*
 * 状态：待发布
 */
INSERT INTO public."taskStatusConfig" (
    code,
    name,
    sort,
    "isCompleted"
)
SELECT
    'pendingRelease',
    '待发布',
    4,
    false
WHERE NOT EXISTS (
    SELECT 1
    FROM public."taskStatusConfig"
    WHERE LOWER(code) = LOWER('pendingRelease')
);

UPDATE public."taskStatusConfig"
SET
    name = '待发布',
    sort = 4,
    "isCompleted" = false,
    "updateTime" = CURRENT_TIMESTAMP
WHERE LOWER(code) = LOWER('pendingRelease');

/*
 * 状态：已完成
 */
INSERT INTO public."taskStatusConfig" (
    code,
    name,
    sort,
    "isCompleted"
)
SELECT
    'done',
    '已完成',
    5,
    true
WHERE NOT EXISTS (
    SELECT 1
    FROM public."taskStatusConfig"
    WHERE LOWER(code) = LOWER('done')
);

UPDATE public."taskStatusConfig"
SET
    name = '已完成',
    sort = 5,
    "isCompleted" = true,
    "updateTime" = CURRENT_TIMESTAMP
WHERE LOWER(code) = LOWER('done');

/*
 * 状态：已取消
 */
INSERT INTO public."taskStatusConfig" (
    code,
    name,
    sort,
    "isCompleted"
)
SELECT
    'canceled',
    '已取消',
    6,
    false
WHERE NOT EXISTS (
    SELECT 1
    FROM public."taskStatusConfig"
    WHERE LOWER(code) = LOWER('canceled')
);

UPDATE public."taskStatusConfig"
SET
    name = '已取消',
    sort = 6,
    "isCompleted" = false,
    "updateTime" = CURRENT_TIMESTAMP
WHERE LOWER(code) = LOWER('canceled');
