ALTER TABLE public."taskType"
    ADD COLUMN IF NOT EXISTS "gitBranchPrefixGroup" character varying(64)
        DEFAULT ''::character varying;
