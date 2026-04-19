/**
 * 为项目任务增加类型字段，并为历史数据回填默认类型。
 */

ALTER TABLE public."projectTask"
    ADD COLUMN IF NOT EXISTS "typeId" bigint;

CREATE INDEX IF NOT EXISTS "idx_projectTask_typeId"
    ON public."projectTask" USING btree ("typeId");

WITH default_type_map AS (
    SELECT
        project.id AS project_id,
        type.id AS type_id
    FROM public.project project
    INNER JOIN public."taskType" type
        ON type."tenantId" = project."tenantId"
       AND type.name = '任务'
)
UPDATE public."projectTask" task
SET "typeId" = default_type_map.type_id
FROM default_type_map
WHERE task."projectId" = default_type_map.project_id
  AND task."typeId" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public."projectTask"
    WHERE "typeId" IS NULL
  ) THEN
    RAISE NOTICE 'projectTask.typeId 仍存在空值，请检查历史数据后再补齐约束';
  ELSE
    ALTER TABLE public."projectTask"
      ALTER COLUMN "typeId" SET NOT NULL;
  END IF;
END
$$;
