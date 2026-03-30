ALTER TABLE "menu"
    ADD COLUMN IF NOT EXISTS "nodeType" smallint NOT NULL DEFAULT 0;

UPDATE "menu"
SET "name" = CASE
    WHEN "path" IS NOT NULL AND "path" <> '' THEN "path"
    WHEN "name" LIKE '/%' THEN "name"
    ELSE '/' || "name"
END,
    "path" = CASE
        WHEN "path" IS NOT NULL AND "path" <> '' THEN "path"
        WHEN "name" LIKE '/%' THEN "name"
        ELSE '/' || "name"
    END,
    "nodeType" = COALESCE("nodeType", 0);
