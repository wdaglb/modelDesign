/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 taskTag 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."taskTag" (
    id bigint NOT NULL,
    "tenantId" bigint NOT NULL,
    name character varying(64) NOT NULL,
    color character varying(32) DEFAULT ''::character varying NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."taskTag_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."taskTag_id_seq" OWNED BY public."taskTag".id;

ALTER TABLE ONLY public."taskTag" ALTER COLUMN id SET DEFAULT nextval('public."taskTag_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'taskTag_pkey'
  ) THEN
    ALTER TABLE ONLY public."taskTag"
      ADD CONSTRAINT "taskTag_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_taskTag_tenant_name'
  ) THEN
    ALTER TABLE ONLY public."taskTag"
      ADD CONSTRAINT "uk_taskTag_tenant_name" UNIQUE ("tenantId", name);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_taskTag_tenant_sort" ON public."taskTag" USING btree ("tenantId", sort);
