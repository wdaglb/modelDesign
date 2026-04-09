/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 qyworkCorpConfig 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."qyworkCorpConfig" (
    id bigint NOT NULL,
    "tenantId" bigint NOT NULL,
    "corpId" character varying(128) NOT NULL,
    "corpSecret" character varying(255) NOT NULL,
    remark character varying(500) DEFAULT ''::character varying NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "agentId" character varying(128) DEFAULT ''::character varying NOT NULL,
    enabled boolean DEFAULT true NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."qyworkCorpConfig_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."qyworkCorpConfig_id_seq" OWNED BY public."qyworkCorpConfig".id;

ALTER TABLE ONLY public."qyworkCorpConfig" ALTER COLUMN id SET DEFAULT nextval('public."qyworkCorpConfig_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'qyworkCorpConfig_pkey'
  ) THEN
    ALTER TABLE ONLY public."qyworkCorpConfig"
      ADD CONSTRAINT "qyworkCorpConfig_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_qyworkCorpConfig_corpId'
  ) THEN
    ALTER TABLE ONLY public."qyworkCorpConfig"
      ADD CONSTRAINT "uk_qyworkCorpConfig_corpId" UNIQUE ("corpId");
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_qyworkCorpConfig_tenantId'
  ) THEN
    ALTER TABLE ONLY public."qyworkCorpConfig"
      ADD CONSTRAINT "uk_qyworkCorpConfig_tenantId" UNIQUE ("tenantId");
  END IF;
END
$$;
