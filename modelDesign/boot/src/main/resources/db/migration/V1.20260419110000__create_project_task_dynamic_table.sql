/**
 * 当前文件负责初始化 projectTaskDynamic 表及其索引与约束，
 * 并使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."projectTaskDynamic" (
    id bigint NOT NULL,
    "taskId" bigint NOT NULL,
    content text NOT NULL,
    "operatorId" bigint NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public."projectTaskDynamic_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."projectTaskDynamic_id_seq"
    OWNED BY public."projectTaskDynamic".id;

ALTER TABLE ONLY public."projectTaskDynamic"
    ALTER COLUMN id
    SET DEFAULT nextval('public."projectTaskDynamic_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projectTaskDynamic_pkey'
  ) THEN
    ALTER TABLE ONLY public."projectTaskDynamic"
      ADD CONSTRAINT "projectTaskDynamic_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_projectTaskDynamic_taskId_createTime"
    ON public."projectTaskDynamic" USING btree ("taskId", "createTime" DESC);

CREATE INDEX IF NOT EXISTS "idx_projectTaskDynamic_operatorId"
    ON public."projectTaskDynamic" USING btree ("operatorId");
