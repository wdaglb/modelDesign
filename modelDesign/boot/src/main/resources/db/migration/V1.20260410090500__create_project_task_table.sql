/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 projectTask 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."projectTask" (
    id bigint NOT NULL,
    "projectId" bigint NOT NULL,
    title character varying(128) NOT NULL,
    description text DEFAULT ''::text,
    status character varying(32) NOT NULL,
    priority character varying(32) NOT NULL,
    "creatorId" bigint NOT NULL,
    "assigneeId" bigint,
    "startTime" timestamp without time zone,
    "dueTime" timestamp without time zone,
    deleted smallint DEFAULT 0 NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "workDays" numeric(10,2),
    "parentTaskId" bigint
);

CREATE SEQUENCE IF NOT EXISTS public."projectTask_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."projectTask_id_seq" OWNED BY public."projectTask".id;

ALTER TABLE ONLY public."projectTask" ALTER COLUMN id SET DEFAULT nextval('public."projectTask_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projectTask_pkey'
  ) THEN
    ALTER TABLE ONLY public."projectTask"
      ADD CONSTRAINT "projectTask_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_projectTask_assigneeId" ON public."projectTask" USING btree ("assigneeId");

CREATE INDEX IF NOT EXISTS "idx_projectTask_parentTaskId" ON public."projectTask" USING btree ("parentTaskId");

CREATE INDEX IF NOT EXISTS "idx_projectTask_projectId_deleted_updateTime" ON public."projectTask" USING btree ("projectId", deleted, "updateTime");

CREATE INDEX IF NOT EXISTS "idx_projectTask_projectId_status" ON public."projectTask" USING btree ("projectId", status);
