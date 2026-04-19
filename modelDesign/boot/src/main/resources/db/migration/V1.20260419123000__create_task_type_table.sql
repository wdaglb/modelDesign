/**
 * 新增租户级任务类型表。
 *
 * 当前文件负责为任务类型管理能力初始化 taskType 表、序列、约束与索引。
 */

CREATE TABLE IF NOT EXISTS public."taskType" (
    id bigint NOT NULL,
    "tenantId" bigint NOT NULL,
    name character varying(64) NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."taskType_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."taskType_id_seq" OWNED BY public."taskType".id;

ALTER TABLE ONLY public."taskType"
    ALTER COLUMN id SET DEFAULT nextval('public."taskType_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'taskType_pkey'
  ) THEN
    ALTER TABLE ONLY public."taskType"
      ADD CONSTRAINT "taskType_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_taskType_tenant_name'
  ) THEN
    ALTER TABLE ONLY public."taskType"
      ADD CONSTRAINT "uk_taskType_tenant_name" UNIQUE ("tenantId", name);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_taskType_tenant_sort"
    ON public."taskType" USING btree ("tenantId", sort);

/**
 * 为已有租户预置基础任务类型，避免升级后旧租户没有类型数据。
 */
WITH tenant_seed AS (
    SELECT DISTINCT "tenantId"
    FROM public.project
    WHERE "tenantId" IS NOT NULL
),
default_type_seed("tenantId", name, sort) AS (
    SELECT "tenantId", '任务', 1 FROM tenant_seed
    UNION ALL
    SELECT "tenantId", '缺陷', 2 FROM tenant_seed
)
INSERT INTO public."taskType" ("tenantId", name, sort)
SELECT seed."tenantId", seed.name, seed.sort
FROM default_type_seed seed
WHERE NOT EXISTS (
    SELECT 1
    FROM public."taskType" existing
    WHERE existing."tenantId" = seed."tenantId"
      AND existing.name = seed.name
);
