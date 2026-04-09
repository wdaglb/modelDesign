/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 userPosition 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."userPosition" (
    id bigint NOT NULL,
    "userId" bigint NOT NULL,
    "positionId" bigint NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."userPosition_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."userPosition_id_seq" OWNED BY public."userPosition".id;

ALTER TABLE ONLY public."userPosition" ALTER COLUMN id SET DEFAULT nextval('public."userPosition_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_userPosition_user_position'
  ) THEN
    ALTER TABLE ONLY public."userPosition"
      ADD CONSTRAINT "uk_userPosition_user_position" UNIQUE ("userId", "positionId");
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'userPosition_pkey'
  ) THEN
    ALTER TABLE ONLY public."userPosition"
      ADD CONSTRAINT "userPosition_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_userPosition_positionId" ON public."userPosition" USING btree ("positionId");

CREATE INDEX IF NOT EXISTS "idx_userPosition_userId" ON public."userPosition" USING btree ("userId");
