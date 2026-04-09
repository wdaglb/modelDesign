/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 projectTaskChangeLog 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."projectTaskChangeLog" (
    id bigint NOT NULL,
    "taskId" bigint NOT NULL,
    "operationType" character varying(32) NOT NULL,
    "operatorId" bigint NOT NULL,
    content jsonb DEFAULT '[]'::jsonb NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."projectTaskChangeLog_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."projectTaskChangeLog_id_seq" OWNED BY public."projectTaskChangeLog".id;

ALTER TABLE ONLY public."projectTaskChangeLog" ALTER COLUMN id SET DEFAULT nextval('public."projectTaskChangeLog_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projectTaskChangeLog_pkey'
  ) THEN
    ALTER TABLE ONLY public."projectTaskChangeLog"
      ADD CONSTRAINT "projectTaskChangeLog_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_projectTaskChangeLog_operatorId" ON public."projectTaskChangeLog" USING btree ("operatorId");

CREATE INDEX IF NOT EXISTS "idx_projectTaskChangeLog_taskId_createTime" ON public."projectTaskChangeLog" USING btree ("taskId", "createTime" DESC);
