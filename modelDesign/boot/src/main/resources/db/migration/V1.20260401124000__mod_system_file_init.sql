CREATE TABLE IF NOT EXISTS "systemFile" (
  "id" varchar(36) PRIMARY KEY,
  "originalFilename" varchar(255) NOT NULL,
  "storagePlatform" varchar(64) NOT NULL,
  "basePath" varchar(255) NOT NULL DEFAULT '',
  "path" varchar(255) NOT NULL DEFAULT '',
  "storageFilename" varchar(255) NOT NULL,
  "thumbnailFilename" varchar(255) NOT NULL DEFAULT '',
  "contentType" varchar(128) NOT NULL DEFAULT '',
  "size" bigint NOT NULL DEFAULT 0,
  "fileType" varchar(16) NOT NULL,
  "creatorId" bigint NOT NULL,
  "deleted" smallint NOT NULL DEFAULT 0,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_systemFile_deleted_updateTime" ON "systemFile" ("deleted", "updateTime");
CREATE INDEX IF NOT EXISTS "idx_systemFile_creatorId" ON "systemFile" ("creatorId");
CREATE INDEX IF NOT EXISTS "idx_systemFile_fileType" ON "systemFile" ("fileType");
