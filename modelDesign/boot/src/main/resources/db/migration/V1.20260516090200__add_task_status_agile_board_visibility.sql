/**
 * 为任务状态配置增加敏捷面板显示开关。
 *
 * 说明：
 * 1. 历史状态默认显示，保证迁移后敏捷面板行为与现状一致。
 * 2. 后续可在任务状态配置页关闭某个状态在敏捷面板中的列和任务展示。
 */

ALTER TABLE public."taskStatusConfig"
    ADD COLUMN IF NOT EXISTS "showInAgileBoard" boolean DEFAULT true NOT NULL;

COMMENT ON COLUMN public."taskStatusConfig"."showInAgileBoard"
    IS '是否显示在敏捷面板';

UPDATE public."taskStatusConfig"
SET
    "showInAgileBoard" = true,
    "updateTime" = CURRENT_TIMESTAMP
WHERE "showInAgileBoard" IS DISTINCT FROM true;
