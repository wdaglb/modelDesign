/**
 * 基于 2026-04-09 的 model_design 数据库快照生成。
 * 当前文件负责初始化 menu 表及其索引与约束，且使用幂等 DDL 兼容已有本地库。
 */

CREATE TABLE IF NOT EXISTS public.menu (
    id bigint NOT NULL,
    "parentId" bigint DEFAULT 0 NOT NULL,
    name character varying(100) NOT NULL,
    title character varying(100) NOT NULL,
    "iconType" character varying(32) DEFAULT 'mdi'::character varying NOT NULL,
    "iconValue" character varying(100) DEFAULT ''::character varying NOT NULL,
    path character varying(200) DEFAULT ''::character varying NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "nodeType" smallint DEFAULT 0 NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.menu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.menu_id_seq OWNED BY public.menu.id;

ALTER TABLE ONLY public.menu ALTER COLUMN id SET DEFAULT nextval('public.menu_id_seq'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'menu_pkey'
  ) THEN
    ALTER TABLE ONLY public.menu
      ADD CONSTRAINT menu_pkey PRIMARY KEY (id);
  END IF;
END
$$;
