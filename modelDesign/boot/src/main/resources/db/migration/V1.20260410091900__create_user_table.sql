/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 user 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."user" (
    id bigint NOT NULL,
    username character varying(64) NOT NULL,
    "passwordHash" character varying(255) NOT NULL,
    nickname character varying(64) NOT NULL,
    "avatarId" character varying(64) DEFAULT ''::character varying,
    status smallint DEFAULT 1 NOT NULL,
    "lastLoginIp" character varying(64) DEFAULT ''::character varying,
    "lastLoginTime" timestamp without time zone,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tenantId" bigint DEFAULT 1 NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_user_username'
  ) THEN
    ALTER TABLE ONLY public."user"
      ADD CONSTRAINT uk_user_username UNIQUE (username);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_pkey'
  ) THEN
    ALTER TABLE ONLY public."user"
      ADD CONSTRAINT user_pkey PRIMARY KEY (id);
  END IF;
END
$$;
