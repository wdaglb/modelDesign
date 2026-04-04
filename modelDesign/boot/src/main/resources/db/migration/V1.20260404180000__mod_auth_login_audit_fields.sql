ALTER TABLE "userLoginHistory"
  ALTER COLUMN "userId" DROP NOT NULL,
  ALTER COLUMN "tenantId" DROP NOT NULL,
  ALTER COLUMN "loginId" DROP NOT NULL;

ALTER TABLE "userLoginHistory"
  ADD COLUMN "loginStatus" varchar(32) NOT NULL DEFAULT 'SUCCESS',
  ADD COLUMN "username" varchar(128),
  ADD COLUMN "userAgent" text,
  ADD COLUMN "browserName" varchar(64),
  ADD COLUMN "browserVersion" varchar(64),
  ADD COLUMN "osName" varchar(64),
  ADD COLUMN "osVersion" varchar(64),
  ADD COLUMN "deviceType" varchar(32) NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "failureReasonCode" varchar(64),
  ADD COLUMN "failureReasonText" varchar(255);

CREATE INDEX "idx_userLoginHistory_loginStatus_createTime"
  ON "userLoginHistory" ("loginStatus", "createTime");

CREATE INDEX "idx_userLoginHistory_username_createTime"
  ON "userLoginHistory" ("username", "createTime");

CREATE INDEX "idx_userLoginHistory_failureReasonCode_createTime"
  ON "userLoginHistory" ("failureReasonCode", "createTime");

CREATE INDEX "idx_userLoginHistory_tenantId_createTime"
  ON "userLoginHistory" ("tenantId", "createTime");

CREATE INDEX "idx_userLoginHistory_tenantId_loginStatus_createTime"
  ON "userLoginHistory" ("tenantId", "loginStatus", "createTime");

CREATE INDEX "idx_userLoginHistory_tenantId_username_createTime"
  ON "userLoginHistory" ("tenantId", "username", "createTime");

CREATE INDEX "idx_userLoginHistory_tenantId_failureReasonCode_createTime"
  ON "userLoginHistory" ("tenantId", "failureReasonCode", "createTime");
