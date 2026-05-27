/**
 * 新增租户级任务迭代表，并允许任务显式绑定迭代。
 *
 * 当前迁移只新增可空绑定字段，不回填历史任务，避免升级时改变既有任务归属。
 */

CREATE TABLE IF NOT EXISTS public."taskIteration" (
    id bigint NOT NULL,
    "tenantId" bigint NOT NULL,
    name character varying(64) NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE public."taskIteration" IS '租户级任务迭代表';
COMMENT ON COLUMN public."taskIteration".id IS '主键 ID';
COMMENT ON COLUMN public."taskIteration"."tenantId" IS '所属租户 ID';
COMMENT ON COLUMN public."taskIteration".name IS '迭代名称';
COMMENT ON COLUMN public."taskIteration"."startDate" IS '迭代开始日期';
COMMENT ON COLUMN public."taskIteration"."endDate" IS '迭代结束日期';
COMMENT ON COLUMN public."taskIteration"."createTime" IS '创建时间';
COMMENT ON COLUMN public."taskIteration"."updateTime" IS '更新时间';

CREATE SEQUENCE IF NOT EXISTS public."taskIteration_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."taskIteration_id_seq"
    OWNED BY public."taskIteration".id;

ALTER TABLE ONLY public."taskIteration"
    ALTER COLUMN id SET DEFAULT nextval('public."taskIteration_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'taskIteration_pkey'
  ) THEN
    ALTER TABLE ONLY public."taskIteration"
      ADD CONSTRAINT "taskIteration_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_taskIteration_tenant_name'
  ) THEN
    ALTER TABLE ONLY public."taskIteration"
      ADD CONSTRAINT "uk_taskIteration_tenant_name"
      UNIQUE ("tenantId", name);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_taskIteration_tenant_date"
    ON public."taskIteration" USING btree ("tenantId", "startDate", "endDate");

ALTER TABLE IF EXISTS public."projectTask"
    ADD COLUMN IF NOT EXISTS "iterationId" bigint;

COMMENT ON COLUMN public."projectTask"."iterationId" IS '任务迭代 ID';

CREATE INDEX IF NOT EXISTS "idx_projectTask_iterationId"
    ON public."projectTask" USING btree ("iterationId");

CREATE INDEX IF NOT EXISTS "idx_projectTask_projectId_iterationId"
    ON public."projectTask" USING btree ("projectId", "iterationId");
