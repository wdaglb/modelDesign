/**
 * 当前文件负责初始化 systemFileAccessConfig 表及其索引与约束。
 * 该表用于按租户保存文件访问域名，供前端拼接图片访问地址。
 */

CREATE TABLE IF NOT EXISTS public."systemFileAccessConfig" (
    id bigint NOT NULL,
    "tenantId" bigint NOT NULL,
    "accessDomain" character varying(255) NOT NULL,
    remark character varying(500) DEFAULT ''::character varying NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."systemFileAccessConfig_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."systemFileAccessConfig_id_seq"
    OWNED BY public."systemFileAccessConfig".id;

ALTER TABLE ONLY public."systemFileAccessConfig"
    ALTER COLUMN id
    SET DEFAULT nextval('public."systemFileAccessConfig_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'systemFileAccessConfig_pkey'
  ) THEN
    ALTER TABLE ONLY public."systemFileAccessConfig"
      ADD CONSTRAINT "systemFileAccessConfig_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_systemFileAccessConfig_tenantId'
  ) THEN
    ALTER TABLE ONLY public."systemFileAccessConfig"
      ADD CONSTRAINT "uk_systemFileAccessConfig_tenantId" UNIQUE ("tenantId");
  END IF;
END
$$;
