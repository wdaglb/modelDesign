/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 tenant 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public.tenant (
    id bigint NOT NULL,
    code character varying(64) NOT NULL,
    name character varying(64) NOT NULL,
    description character varying(255) DEFAULT ''::character varying NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    deleted smallint DEFAULT 0 NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.tenant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.tenant_id_seq OWNED BY public.tenant.id;

ALTER TABLE ONLY public.tenant ALTER COLUMN id SET DEFAULT nextval('public.tenant_id_seq'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenant_pkey'
  ) THEN
    ALTER TABLE ONLY public.tenant
      ADD CONSTRAINT tenant_pkey PRIMARY KEY (id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_tenant_deleted_updateTime" ON public.tenant USING btree (deleted, "updateTime");

CREATE UNIQUE INDEX IF NOT EXISTS uk_tenant_code_active ON public.tenant USING btree (lower((code)::text)) WHERE (deleted = 0);
