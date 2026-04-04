ALTER TABLE "qyworkCorpConfig"
  ADD COLUMN IF NOT EXISTS "agentId" varchar(128) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "enabled" boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "userOauth" (
  "id" bigserial PRIMARY KEY,
  "tenantId" bigint NOT NULL,
  "userId" bigint NOT NULL,
  "provider" varchar(64) NOT NULL,
  "providerAppId" varchar(255) NOT NULL,
  "providerUserId" varchar(255) NOT NULL,
  "providerUnionId" varchar(255),
  "providerOpenId" varchar(255),
  "nickname" varchar(255),
  "avatar" varchar(500),
  "extraJson" text NOT NULL DEFAULT '',
  "bindSource" varchar(32) NOT NULL,
  "status" varchar(32) NOT NULL,
  "boundAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAuthAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uk_userOauth_user_provider" UNIQUE ("tenantId", "userId", "provider"),
  CONSTRAINT "uk_userOauth_provider_identity" UNIQUE ("tenantId", "provider", "providerAppId", "providerUserId")
);
