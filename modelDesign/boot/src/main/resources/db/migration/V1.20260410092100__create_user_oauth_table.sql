/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 userOauth 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."userOauth" (
    id bigint NOT NULL,
    "tenantId" bigint NOT NULL,
    "userId" bigint NOT NULL,
    provider character varying(64) NOT NULL,
    "providerAppId" character varying(255) NOT NULL,
    "providerUserId" character varying(255) NOT NULL,
    "providerUnionId" character varying(255),
    "providerOpenId" character varying(255),
    nickname character varying(255),
    avatar character varying(500),
    "extraJson" text DEFAULT ''::text NOT NULL,
    "bindSource" character varying(32) NOT NULL,
    status character varying(32) NOT NULL,
    "boundAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastAuthAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."userOauth_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."userOauth_id_seq" OWNED BY public."userOauth".id;

ALTER TABLE ONLY public."userOauth" ALTER COLUMN id SET DEFAULT nextval('public."userOauth_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_userOauth_provider_identity'
  ) THEN
    ALTER TABLE ONLY public."userOauth"
      ADD CONSTRAINT "uk_userOauth_provider_identity" UNIQUE ("tenantId", provider, "providerAppId", "providerUserId");
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_userOauth_user_provider'
  ) THEN
    ALTER TABLE ONLY public."userOauth"
      ADD CONSTRAINT "uk_userOauth_user_provider" UNIQUE ("tenantId", "userId", provider);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'userOauth_pkey'
  ) THEN
    ALTER TABLE ONLY public."userOauth"
      ADD CONSTRAINT "userOauth_pkey" PRIMARY KEY (id);
  END IF;
END
$$;
