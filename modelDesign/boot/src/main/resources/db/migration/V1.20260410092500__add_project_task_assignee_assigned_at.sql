/*
 * 补充项目任务负责人首次分配时间字段。
 * 当前字段被任务写入与耗时指标流程依赖，缺失时会导致 PostgreSQL 查询报错。
 *
 * 当前迁移只补充列结构，不修改历史数据。
 */
ALTER TABLE IF EXISTS public."projectTask"
ADD COLUMN IF NOT EXISTS "assigneeAssignedAt" timestamp without time zone;
