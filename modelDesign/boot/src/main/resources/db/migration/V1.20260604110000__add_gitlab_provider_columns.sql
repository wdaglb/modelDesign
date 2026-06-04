ALTER TABLE public."gitlabTenantConfig"
    ADD COLUMN IF NOT EXISTS "providerCode" varchar(100) NOT NULL DEFAULT 'gitlab-v4';

COMMENT ON COLUMN public."gitlabTenantConfig"."providerCode"
    IS 'GitLab provider编码';

ALTER TABLE public."gitlabTenantConfig"
    ADD COLUMN IF NOT EXISTS "providerVersion" varchar(100) NOT NULL DEFAULT '1.0.0';

COMMENT ON COLUMN public."gitlabTenantConfig"."providerVersion"
    IS 'GitLab provider版本';
