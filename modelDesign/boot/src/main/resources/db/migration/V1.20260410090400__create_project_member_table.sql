/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 projectMember 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."projectMember" (
    id bigint NOT NULL,
    "projectId" bigint NOT NULL,
    "userId" bigint NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."projectMember_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."projectMember_id_seq" OWNED BY public."projectMember".id;

ALTER TABLE ONLY public."projectMember" ALTER COLUMN id SET DEFAULT nextval('public."projectMember_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projectMember_pkey'
  ) THEN
    ALTER TABLE ONLY public."projectMember"
      ADD CONSTRAINT "projectMember_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_projectMember_project_user'
  ) THEN
    ALTER TABLE ONLY public."projectMember"
      ADD CONSTRAINT "uk_projectMember_project_user" UNIQUE ("projectId", "userId");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_projectMember_projectId" ON public."projectMember" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "idx_projectMember_userId" ON public."projectMember" USING btree ("userId");
