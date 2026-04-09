/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 projectTaskTag 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."projectTaskTag" (
    id bigint NOT NULL,
    "taskId" bigint NOT NULL,
    "tagId" bigint NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."projectTaskTag_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."projectTaskTag_id_seq" OWNED BY public."projectTaskTag".id;

ALTER TABLE ONLY public."projectTaskTag" ALTER COLUMN id SET DEFAULT nextval('public."projectTaskTag_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projectTaskTag_pkey'
  ) THEN
    ALTER TABLE ONLY public."projectTaskTag"
      ADD CONSTRAINT "projectTaskTag_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_projectTaskTag_task_tag'
  ) THEN
    ALTER TABLE ONLY public."projectTaskTag"
      ADD CONSTRAINT "uk_projectTaskTag_task_tag" UNIQUE ("taskId", "tagId");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_projectTaskTag_tagId" ON public."projectTaskTag" USING btree ("tagId");

CREATE INDEX IF NOT EXISTS "idx_projectTaskTag_taskId" ON public."projectTaskTag" USING btree ("taskId");
