/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 projectTaskMember 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."projectTaskMember" (
    id bigint NOT NULL,
    "taskId" bigint NOT NULL,
    "userId" bigint NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."projectTaskMember_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."projectTaskMember_id_seq" OWNED BY public."projectTaskMember".id;

ALTER TABLE ONLY public."projectTaskMember" ALTER COLUMN id SET DEFAULT nextval('public."projectTaskMember_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projectTaskMember_pkey'
  ) THEN
    ALTER TABLE ONLY public."projectTaskMember"
      ADD CONSTRAINT "projectTaskMember_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_projectTaskMember_task_user'
  ) THEN
    ALTER TABLE ONLY public."projectTaskMember"
      ADD CONSTRAINT "uk_projectTaskMember_task_user" UNIQUE ("taskId", "userId");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_projectTaskMember_taskId" ON public."projectTaskMember" USING btree ("taskId");

CREATE INDEX IF NOT EXISTS "idx_projectTaskMember_userId" ON public."projectTaskMember" USING btree ("userId");
