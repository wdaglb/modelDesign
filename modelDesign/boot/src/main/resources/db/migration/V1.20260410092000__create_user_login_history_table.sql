/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 userLoginHistory 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."userLoginHistory" (
    id bigint NOT NULL,
    "userId" bigint,
    "tenantId" bigint,
    "loginId" character varying(64),
    "loginIp" character varying(64) DEFAULT ''::character varying NOT NULL,
    "loginType" character varying(32) DEFAULT ''::character varying NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "loginStatus" character varying(32) DEFAULT 'SUCCESS'::character varying NOT NULL,
    username character varying(128),
    "userAgent" text,
    "browserName" character varying(64),
    "browserVersion" character varying(64),
    "osName" character varying(64),
    "osVersion" character varying(64),
    "deviceType" character varying(32) DEFAULT 'UNKNOWN'::character varying NOT NULL,
    "failureReasonCode" character varying(64),
    "failureReasonText" character varying(255)
);

CREATE SEQUENCE IF NOT EXISTS public."userLoginHistory_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."userLoginHistory_id_seq" OWNED BY public."userLoginHistory".id;

ALTER TABLE ONLY public."userLoginHistory" ALTER COLUMN id SET DEFAULT nextval('public."userLoginHistory_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'userLoginHistory_pkey'
  ) THEN
    ALTER TABLE ONLY public."userLoginHistory"
      ADD CONSTRAINT "userLoginHistory_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_userLoginHistory_failureReasonCode_createTime" ON public."userLoginHistory" USING btree ("failureReasonCode", "createTime");

CREATE INDEX IF NOT EXISTS "idx_userLoginHistory_loginStatus_createTime" ON public."userLoginHistory" USING btree ("loginStatus", "createTime");

CREATE INDEX IF NOT EXISTS "idx_userLoginHistory_tenantId_createTime" ON public."userLoginHistory" USING btree ("tenantId", "createTime");

CREATE INDEX IF NOT EXISTS "idx_userLoginHistory_tenantId_failureReasonCode_createTime" ON public."userLoginHistory" USING btree ("tenantId", "failureReasonCode", "createTime");

CREATE INDEX IF NOT EXISTS "idx_userLoginHistory_tenantId_loginStatus_createTime" ON public."userLoginHistory" USING btree ("tenantId", "loginStatus", "createTime");

CREATE INDEX IF NOT EXISTS "idx_userLoginHistory_tenantId_username_createTime" ON public."userLoginHistory" USING btree ("tenantId", username, "createTime");

CREATE INDEX IF NOT EXISTS "idx_userLoginHistory_userId_createTime" ON public."userLoginHistory" USING btree ("userId", "createTime");

CREATE INDEX IF NOT EXISTS "idx_userLoginHistory_username_createTime" ON public."userLoginHistory" USING btree (username, "createTime");
