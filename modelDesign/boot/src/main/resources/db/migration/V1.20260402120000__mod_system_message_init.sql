CREATE TABLE IF NOT EXISTS "systemMessage" (
  "id" bigserial PRIMARY KEY,
  "scopeType" varchar(16) NOT NULL,
  "tenantId" bigint,
  "receiverUserId" bigint,
  "category" varchar(64) NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "redirectUrl" varchar(500) NOT NULL DEFAULT '',
  "deleted" smallint NOT NULL DEFAULT 0,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_systemMessage_deleted_createTime" ON "systemMessage" ("deleted", "createTime");
CREATE INDEX IF NOT EXISTS "idx_systemMessage_receiverUserId" ON "systemMessage" ("receiverUserId");
CREATE INDEX IF NOT EXISTS "idx_systemMessage_scopeType_tenantId" ON "systemMessage" ("scopeType", "tenantId");

CREATE TABLE IF NOT EXISTS "systemMessageReadRecord" (
  "id" bigserial PRIMARY KEY,
  "messageId" bigint NOT NULL,
  "userId" bigint NOT NULL,
  "readTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_systemMessageReadRecord_messageId_userId" UNIQUE ("messageId", "userId")
);

CREATE INDEX IF NOT EXISTS "idx_systemMessageReadRecord_userId" ON "systemMessageReadRecord" ("userId");
CREATE INDEX IF NOT EXISTS "idx_systemMessageReadRecord_messageId" ON "systemMessageReadRecord" ("messageId");

CREATE TABLE IF NOT EXISTS "systemMessagePushTask" (
  "id" bigserial PRIMARY KEY,
  "messageId" bigint NOT NULL,
  "adapterCode" varchar(64) NOT NULL,
  "status" varchar(32) NOT NULL,
  "retryCount" integer NOT NULL DEFAULT 0,
  "nextRetryTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" varchar(1000) NOT NULL DEFAULT '',
  "tenantId" bigint,
  "receiverUserId" bigint,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_systemMessagePushTask_messageId_adapterCode" UNIQUE ("messageId", "adapterCode")
);

CREATE INDEX IF NOT EXISTS "idx_systemMessagePushTask_status_nextRetryTime" ON "systemMessagePushTask" ("status", "nextRetryTime");
CREATE INDEX IF NOT EXISTS "idx_systemMessagePushTask_messageId" ON "systemMessagePushTask" ("messageId");
