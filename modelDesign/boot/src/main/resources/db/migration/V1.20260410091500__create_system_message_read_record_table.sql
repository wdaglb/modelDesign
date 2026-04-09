/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 systemMessageReadRecord 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."systemMessageReadRecord" (
    id bigint NOT NULL,
    "messageId" bigint NOT NULL,
    "userId" bigint NOT NULL,
    "readTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."systemMessageReadRecord_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."systemMessageReadRecord_id_seq" OWNED BY public."systemMessageReadRecord".id;

ALTER TABLE ONLY public."systemMessageReadRecord" ALTER COLUMN id SET DEFAULT nextval('public."systemMessageReadRecord_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'systemMessageReadRecord_pkey'
  ) THEN
    ALTER TABLE ONLY public."systemMessageReadRecord"
      ADD CONSTRAINT "systemMessageReadRecord_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_systemMessageReadRecord_messageId_userId'
  ) THEN
    ALTER TABLE ONLY public."systemMessageReadRecord"
      ADD CONSTRAINT "uk_systemMessageReadRecord_messageId_userId" UNIQUE ("messageId", "userId");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_systemMessageReadRecord_messageId" ON public."systemMessageReadRecord" USING btree ("messageId");

CREATE INDEX IF NOT EXISTS "idx_systemMessageReadRecord_userId" ON public."systemMessageReadRecord" USING btree ("userId");
