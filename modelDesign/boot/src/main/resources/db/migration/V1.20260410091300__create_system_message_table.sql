/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 systemMessage 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."systemMessage" (
    id bigint NOT NULL,
    "scopeType" character varying(16) NOT NULL,
    "tenantId" bigint,
    "receiverUserId" bigint,
    category character varying(64) NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    "redirectUrl" character varying(500) DEFAULT ''::character varying NOT NULL,
    deleted smallint DEFAULT 0 NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."systemMessage_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."systemMessage_id_seq" OWNED BY public."systemMessage".id;

ALTER TABLE ONLY public."systemMessage" ALTER COLUMN id SET DEFAULT nextval('public."systemMessage_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'systemMessage_pkey'
  ) THEN
    ALTER TABLE ONLY public."systemMessage"
      ADD CONSTRAINT "systemMessage_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_systemMessage_deleted_createTime" ON public."systemMessage" USING btree (deleted, "createTime");

CREATE INDEX IF NOT EXISTS "idx_systemMessage_receiverUserId" ON public."systemMessage" USING btree ("receiverUserId");

CREATE INDEX IF NOT EXISTS "idx_systemMessage_scopeType_tenantId" ON public."systemMessage" USING btree ("scopeType", "tenantId");
