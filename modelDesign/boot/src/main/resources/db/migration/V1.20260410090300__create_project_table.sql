/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 project 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public.project (
    id bigint NOT NULL,
    code character varying(64) NOT NULL,
    name character varying(128) NOT NULL,
    description text DEFAULT ''::text,
    "dbType" character varying(32) NOT NULL,
    "creatorId" bigint NOT NULL,
    deleted smallint DEFAULT 0 NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(32) DEFAULT 'planning'::character varying NOT NULL,
    "projectGroup" character varying(64) DEFAULT ''::character varying NOT NULL,
    "progressSummary" text DEFAULT ''::text NOT NULL,
    "completedModuleCount" integer DEFAULT 0 NOT NULL,
    "tenantId" bigint DEFAULT 1 NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.project_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.project_id_seq OWNED BY public.project.id;

ALTER TABLE ONLY public.project ALTER COLUMN id SET DEFAULT nextval('public.project_id_seq'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'project_pkey'
  ) THEN
    ALTER TABLE ONLY public.project
      ADD CONSTRAINT project_pkey PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_project_tenant_code'
  ) THEN
    ALTER TABLE ONLY public.project
      ADD CONSTRAINT uk_project_tenant_code UNIQUE ("tenantId", code);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_project_deleted_status_updateTime" ON public.project USING btree (deleted, status, "updateTime");

CREATE INDEX IF NOT EXISTS "idx_project_deleted_updateTime" ON public.project USING btree (deleted, "updateTime");

CREATE INDEX IF NOT EXISTS "idx_project_tenantId" ON public.project USING btree ("tenantId");
