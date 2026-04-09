/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 position 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."position" (
    id bigint NOT NULL,
    "tenantId" bigint NOT NULL,
    name character varying(64) NOT NULL,
    code character varying(64) NOT NULL,
    remark character varying(255) DEFAULT ''::character varying NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.position_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.position_id_seq OWNED BY public."position".id;

ALTER TABLE ONLY public."position" ALTER COLUMN id SET DEFAULT nextval('public.position_id_seq'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'position_pkey'
  ) THEN
    ALTER TABLE ONLY public."position"
      ADD CONSTRAINT position_pkey PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_position_tenant_code'
  ) THEN
    ALTER TABLE ONLY public."position"
      ADD CONSTRAINT uk_position_tenant_code UNIQUE ("tenantId", code);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_position_tenantId" ON public."position" USING btree ("tenantId");

CREATE INDEX IF NOT EXISTS idx_position_tenant_status ON public."position" USING btree ("tenantId", status);

CREATE INDEX IF NOT EXISTS "idx_position_tenant_updateTime" ON public."position" USING btree ("tenantId", "updateTime");
