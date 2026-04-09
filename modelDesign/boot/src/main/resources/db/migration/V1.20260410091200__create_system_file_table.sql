/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 systemFile 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public."systemFile" (
    id character varying(36) NOT NULL,
    "originalFilename" character varying(255) NOT NULL,
    "storagePlatform" character varying(64) NOT NULL,
    "basePath" character varying(255) DEFAULT ''::character varying NOT NULL,
    path character varying(255) DEFAULT ''::character varying NOT NULL,
    "storageFilename" character varying(255) NOT NULL,
    "thumbnailFilename" character varying(255) DEFAULT ''::character varying NOT NULL,
    "contentType" character varying(128) DEFAULT ''::character varying NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    "fileType" character varying(16) NOT NULL,
    "creatorId" bigint NOT NULL,
    deleted smallint DEFAULT 0 NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'systemFile_pkey'
  ) THEN
    ALTER TABLE ONLY public."systemFile"
      ADD CONSTRAINT "systemFile_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_systemFile_creatorId" ON public."systemFile" USING btree ("creatorId");

CREATE INDEX IF NOT EXISTS "idx_systemFile_deleted_updateTime" ON public."systemFile" USING btree (deleted, "updateTime");

CREATE INDEX IF NOT EXISTS "idx_systemFile_fileType" ON public."systemFile" USING btree ("fileType");
