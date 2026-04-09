/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 projectTaskDependency 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."projectTaskDependency" (
    id bigint NOT NULL,
    "taskId" bigint NOT NULL,
    "predecessorTaskId" bigint NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."projectTaskDependency_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."projectTaskDependency_id_seq" OWNED BY public."projectTaskDependency".id;

ALTER TABLE ONLY public."projectTaskDependency" ALTER COLUMN id SET DEFAULT nextval('public."projectTaskDependency_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projectTaskDependency_pkey'
  ) THEN
    ALTER TABLE ONLY public."projectTaskDependency"
      ADD CONSTRAINT "projectTaskDependency_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_projectTaskDependency_task_predecessor'
  ) THEN
    ALTER TABLE ONLY public."projectTaskDependency"
      ADD CONSTRAINT "uk_projectTaskDependency_task_predecessor" UNIQUE ("taskId", "predecessorTaskId");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_projectTaskDependency_predecessorTaskId" ON public."projectTaskDependency" USING btree ("predecessorTaskId");

CREATE INDEX IF NOT EXISTS "idx_projectTaskDependency_taskId" ON public."projectTaskDependency" USING btree ("taskId");
