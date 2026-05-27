/**
 * 为任务迭代增加是否已发布字段。
 *
 * 默认值为 false，避免升级后把历史迭代错误标记为已发布。
 */

ALTER TABLE IF EXISTS public."taskIteration"
    ADD COLUMN IF NOT EXISTS published boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN public."taskIteration".published IS '是否已发布';
