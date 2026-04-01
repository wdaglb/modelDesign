CREATE TABLE IF NOT EXISTS "userLoginHistory" (
  "id" bigserial PRIMARY KEY,
  "userId" bigint NOT NULL,
  "tenantId" bigint NOT NULL,
  "loginId" varchar(64) NOT NULL,
  "loginIp" varchar(64) NOT NULL DEFAULT '',
  "loginType" varchar(32) NOT NULL DEFAULT '',
  "createTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updateTime" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_userLoginHistory_userId_createTime"
  ON "userLoginHistory" ("userId", "createTime");
