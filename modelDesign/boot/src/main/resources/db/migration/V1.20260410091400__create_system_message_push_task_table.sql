/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 systemMessagePushTask 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."systemMessagePushTask" (
    id bigint NOT NULL,
    "messageId" bigint NOT NULL,
    "adapterCode" character varying(64) NOT NULL,
    status character varying(32) NOT NULL,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "nextRetryTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastError" character varying(1000) DEFAULT ''::character varying NOT NULL,
    "tenantId" bigint,
    "receiverUserId" bigint,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."systemMessagePushTask_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."systemMessagePushTask_id_seq" OWNED BY public."systemMessagePushTask".id;

ALTER TABLE ONLY public."systemMessagePushTask" ALTER COLUMN id SET DEFAULT nextval('public."systemMessagePushTask_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'systemMessagePushTask_pkey'
  ) THEN
    ALTER TABLE ONLY public."systemMessagePushTask"
      ADD CONSTRAINT "systemMessagePushTask_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_systemMessagePushTask_messageId_adapterCode'
  ) THEN
    ALTER TABLE ONLY public."systemMessagePushTask"
      ADD CONSTRAINT "uk_systemMessagePushTask_messageId_adapterCode" UNIQUE ("messageId", "adapterCode");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_systemMessagePushTask_messageId" ON public."systemMessagePushTask" USING btree ("messageId");

CREATE INDEX IF NOT EXISTS "idx_systemMessagePushTask_status_nextRetryTime" ON public."systemMessagePushTask" USING btree (status, "nextRetryTime");
