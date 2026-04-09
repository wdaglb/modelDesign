/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 casbin_rule 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE SEQUENCE IF NOT EXISTS public.casbin_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS public.casbin_rule (
    id integer DEFAULT nextval('public.casbin_sequence'::regclass) NOT NULL,
    ptype character varying(100) NOT NULL,
    v0 character varying(100),
    v1 character varying(100),
    v2 character varying(100),
    v3 character varying(100),
    v4 character varying(100),
    v5 character varying(100)
);

ALTER SEQUENCE public.casbin_sequence OWNED BY public.casbin_rule.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'casbin_rule_pkey'
  ) THEN
    ALTER TABLE ONLY public.casbin_rule
      ADD CONSTRAINT casbin_rule_pkey PRIMARY KEY (id);
  END IF;
END
$$;
