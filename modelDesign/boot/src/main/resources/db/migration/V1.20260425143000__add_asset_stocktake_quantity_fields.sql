/**
 * 为盘点明细补充数量核验字段。
 *
 * 现有设备台账是逐台设备模型，因此每条盘点明细的账面数量默认 1；
 * 实际数量由盘点人登记，差异数量用于页面直接展示盘盈/盘亏差异。
 */

ALTER TABLE public."assetStocktakeItem"
    ADD COLUMN IF NOT EXISTS "expectedQuantity" integer DEFAULT 1 NOT NULL;

ALTER TABLE public."assetStocktakeItem"
    ADD COLUMN IF NOT EXISTS "actualQuantity" integer;

ALTER TABLE public."assetStocktakeItem"
    ADD COLUMN IF NOT EXISTS "differenceQuantity" integer;

UPDATE public."assetStocktakeItem"
SET "expectedQuantity" = 1
WHERE "expectedQuantity" IS NULL;

UPDATE public."assetStocktakeItem"
SET
    "actualQuantity" = CASE
        WHEN "resultStatus" = 1 THEN "expectedQuantity"
        WHEN "resultStatus" = 2 THEN 0
        ELSE "actualQuantity"
    END,
    "differenceQuantity" = CASE
        WHEN "resultStatus" IN (1, 2) THEN
            COALESCE("actualQuantity", CASE
                WHEN "resultStatus" = 1 THEN "expectedQuantity"
                WHEN "resultStatus" = 2 THEN 0
            END) - "expectedQuantity"
        ELSE "differenceQuantity"
    END
WHERE "resultStatus" IS NOT NULL;
