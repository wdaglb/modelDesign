/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 taskStatusConfig 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."taskStatusConfig" (
    id bigint NOT NULL,
    code character varying(32) NOT NULL,
    name character varying(64) NOT NULL,
    sort integer NOT NULL,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."taskStatusConfig_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."taskStatusConfig_id_seq" OWNED BY public."taskStatusConfig".id;

ALTER TABLE ONLY public."taskStatusConfig" ALTER COLUMN id SET DEFAULT nextval('public."taskStatusConfig_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'taskStatusConfig_pkey'
  ) THEN
    ALTER TABLE ONLY public."taskStatusConfig"
      ADD CONSTRAINT "taskStatusConfig_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_taskStatusConfig_sort" ON public."taskStatusConfig" USING btree (sort);

CREATE UNIQUE INDEX IF NOT EXISTS "uk_taskStatusConfig_code_lower" ON public."taskStatusConfig" USING btree (lower((code)::text));

CREATE UNIQUE INDEX IF NOT EXISTS "uk_taskStatusConfig_name_lower" ON public."taskStatusConfig" USING btree (lower((name)::text));
