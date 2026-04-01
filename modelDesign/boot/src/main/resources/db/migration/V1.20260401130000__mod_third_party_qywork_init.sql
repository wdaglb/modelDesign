CREATE TABLE IF NOT EXISTS "qyworkCorpConfig" (
  "id" bigserial PRIMARY KEY,
  "tenantId" bigint NOT NULL,
  "corpId" varchar(128) NOT NULL,
  "corpSecret" varchar(255) NOT NULL,
  "remark" varchar(500) NOT NULL DEFAULT '',
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_qyworkCorpConfig_tenantId" UNIQUE ("tenantId"),
  CONSTRAINT "uk_qyworkCorpConfig_corpId" UNIQUE ("corpId")
);
