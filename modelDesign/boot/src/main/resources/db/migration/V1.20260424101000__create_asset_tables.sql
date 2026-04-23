/**
 * 创建设备库存管理基础表。
 *
 * 约束说明：
 * 1. 所有资产域表都按 tenantId 做数据隔离。
 * 2. assetDevice 只保存设备当前最新状态，历史变更统一落在 assetTransaction。
 * 3. 盘点任务与盘点明细拆表，避免任务汇总字段和逐台设备结果耦合。
 */

CREATE TABLE IF NOT EXISTS public."assetCategory" (
    id bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    name varchar(100) NOT NULL,
    sort integer DEFAULT 1 NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    remark varchar(500) DEFAULT '' NOT NULL,
    "createTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public."assetCategory"
    DROP CONSTRAINT IF EXISTS "uk_assetCategory_tenant_name";

ALTER TABLE public."assetCategory"
    ADD CONSTRAINT "uk_assetCategory_tenant_name"
    UNIQUE ("tenantId", name);

CREATE INDEX IF NOT EXISTS "idx_assetCategory_tenant_sort"
    ON public."assetCategory" USING btree ("tenantId", sort);

CREATE TABLE IF NOT EXISTS public."assetLocation" (
    id bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    name varchar(100) NOT NULL,
    code varchar(64) NOT NULL,
    "parentId" bigint DEFAULT 0 NOT NULL,
    "managerUserId" bigint,
    sort integer DEFAULT 1 NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    remark varchar(500) DEFAULT '' NOT NULL,
    "createTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public."assetLocation"
    DROP CONSTRAINT IF EXISTS "uk_assetLocation_tenant_code";

ALTER TABLE public."assetLocation"
    ADD CONSTRAINT "uk_assetLocation_tenant_code"
    UNIQUE ("tenantId", code);

CREATE INDEX IF NOT EXISTS "idx_assetLocation_tenant_parent_sort"
    ON public."assetLocation" USING btree ("tenantId", "parentId", sort);

CREATE TABLE IF NOT EXISTS public."assetDevice" (
    id bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    "deviceName" varchar(100) NOT NULL,
    "categoryId" bigint NOT NULL,
    "assetCode" varchar(64) NOT NULL,
    "serialNumber" varchar(128),
    status integer NOT NULL,
    "locationId" bigint,
    "currentUserId" bigint,
    "purchaseDate" date,
    remark varchar(500) DEFAULT '' NOT NULL,
    "lastOperatedAt" timestamp,
    deleted integer DEFAULT 0 NOT NULL,
    "createTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public."assetDevice"
    DROP CONSTRAINT IF EXISTS "uk_assetDevice_tenant_assetCode";

ALTER TABLE public."assetDevice"
    ADD CONSTRAINT "uk_assetDevice_tenant_assetCode"
    UNIQUE ("tenantId", "assetCode");

CREATE UNIQUE INDEX IF NOT EXISTS "uk_assetDevice_tenant_serialNumber_not_null"
    ON public."assetDevice" USING btree ("tenantId", "serialNumber")
    WHERE "serialNumber" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_assetDevice_tenant_status_updateTime"
    ON public."assetDevice" USING btree ("tenantId", status, "updateTime");

CREATE TABLE IF NOT EXISTS public."assetTransaction" (
    id bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    "deviceId" bigint NOT NULL,
    "transactionType" integer NOT NULL,
    "beforeStatus" integer,
    "afterStatus" integer,
    "beforeLocationId" bigint,
    "afterLocationId" bigint,
    "beforeUserId" bigint,
    "afterUserId" bigint,
    "operatorUserId" bigint NOT NULL,
    "occurredAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remark varchar(500) DEFAULT '' NOT NULL,
    "createTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_assetTransaction_tenant_device_occurredAt"
    ON public."assetTransaction" USING btree ("tenantId", "deviceId", "occurredAt");

CREATE TABLE IF NOT EXISTS public."assetStocktakeTask" (
    id bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    name varchar(120) NOT NULL,
    "scopeType" integer NOT NULL,
    "scopeLocationId" bigint,
    status integer NOT NULL,
    "startedAt" timestamp,
    "finishedAt" timestamp,
    remark varchar(500) DEFAULT '' NOT NULL,
    "createdUserId" bigint NOT NULL,
    "createTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_assetStocktakeTask_tenant_status_createTime"
    ON public."assetStocktakeTask" USING btree ("tenantId", status, "createTime");

CREATE TABLE IF NOT EXISTS public."assetStocktakeItem" (
    id bigserial PRIMARY KEY,
    "tenantId" bigint NOT NULL,
    "taskId" bigint NOT NULL,
    "deviceId" bigint NOT NULL,
    "resultStatus" integer,
    "actualLocationId" bigint,
    "actualUserId" bigint,
    "checkedUserId" bigint,
    "checkedAt" timestamp,
    remark varchar(500) DEFAULT '' NOT NULL,
    "createTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public."assetStocktakeItem"
    DROP CONSTRAINT IF EXISTS "uk_assetStocktakeItem_task_device";

ALTER TABLE public."assetStocktakeItem"
    ADD CONSTRAINT "uk_assetStocktakeItem_task_device"
    UNIQUE ("taskId", "deviceId");

CREATE INDEX IF NOT EXISTS "idx_assetStocktakeItem_tenant_task_result"
    ON public."assetStocktakeItem" USING btree ("tenantId", "taskId", "resultStatus");
