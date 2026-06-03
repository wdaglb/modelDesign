/**
 * 新增 GitLab 租户私有配置表。
 *
 * Token 字段只保存密文，避免后台配置查询、数据库备份或排障时直接暴露
 * GitLab 访问密钥。每个租户只允许维护一份 GitLab 配置。
 */

CREATE TABLE IF NOT EXISTS public."gitlabTenantConfig" (
    id bigint NOT NULL,
    "tenantId" bigint NOT NULL,
    "serverUrl" character varying(500) NOT NULL,
    "accessTokenCipher" text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    remark character varying(500) DEFAULT ''::character varying NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE public."gitlabTenantConfig" IS 'GitLab 租户私有配置表';
COMMENT ON COLUMN public."gitlabTenantConfig".id IS '主键 ID';
COMMENT ON COLUMN public."gitlabTenantConfig"."tenantId" IS '租户 ID，每个租户仅一条 GitLab 配置';
COMMENT ON COLUMN public."gitlabTenantConfig"."serverUrl" IS 'GitLab 服务器地址';
COMMENT ON COLUMN public."gitlabTenantConfig"."accessTokenCipher" IS '加密后的 GitLab 访问 Token';
COMMENT ON COLUMN public."gitlabTenantConfig".enabled IS '是否启用当前租户 GitLab 配置';
COMMENT ON COLUMN public."gitlabTenantConfig".remark IS '备注';
COMMENT ON COLUMN public."gitlabTenantConfig"."createTime" IS '创建时间';
COMMENT ON COLUMN public."gitlabTenantConfig"."updateTime" IS '更新时间';

CREATE SEQUENCE IF NOT EXISTS public."gitlabTenantConfig_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."gitlabTenantConfig_id_seq" OWNED BY public."gitlabTenantConfig".id;

ALTER TABLE ONLY public."gitlabTenantConfig"
    ALTER COLUMN id SET DEFAULT nextval('public."gitlabTenantConfig_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gitlabTenantConfig_pkey'
  ) THEN
    ALTER TABLE ONLY public."gitlabTenantConfig"
      ADD CONSTRAINT "gitlabTenantConfig_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_gitlabTenantConfig_tenantId'
  ) THEN
    ALTER TABLE ONLY public."gitlabTenantConfig"
      ADD CONSTRAINT "uk_gitlabTenantConfig_tenantId" UNIQUE ("tenantId");
  END IF;
END
$$;
