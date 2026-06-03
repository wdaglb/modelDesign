/**
 * 新增项目与 GitLab 仓库绑定表。
 *
 * 绑定表保存 GitLab 仓库快照，避免 GitLab 服务器不可用或仓库改名时，
 * 项目详情完全依赖实时接口导致编辑表单无法稳定回显。
 */

CREATE TABLE IF NOT EXISTS public."projectGitlabRepository" (
    id bigint NOT NULL,
    "tenantId" bigint NOT NULL,
    "projectId" bigint NOT NULL,
    "gitlabProjectId" bigint NOT NULL,
    name character varying(255) NOT NULL,
    "pathWithNamespace" character varying(500) NOT NULL,
    "webUrl" character varying(1000) NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE public."projectGitlabRepository" IS '项目 GitLab 仓库绑定表';
COMMENT ON COLUMN public."projectGitlabRepository".id IS '主键 ID';
COMMENT ON COLUMN public."projectGitlabRepository"."tenantId" IS '租户 ID，用于隔离不同租户的项目仓库绑定';
COMMENT ON COLUMN public."projectGitlabRepository"."projectId" IS '本地项目 ID';
COMMENT ON COLUMN public."projectGitlabRepository"."gitlabProjectId" IS 'GitLab 项目 ID';
COMMENT ON COLUMN public."projectGitlabRepository".name IS 'GitLab 项目名称快照';
COMMENT ON COLUMN public."projectGitlabRepository"."pathWithNamespace" IS 'GitLab 项目完整命名空间路径快照';
COMMENT ON COLUMN public."projectGitlabRepository"."webUrl" IS 'GitLab 项目网页地址快照';
COMMENT ON COLUMN public."projectGitlabRepository"."createTime" IS '创建时间';
COMMENT ON COLUMN public."projectGitlabRepository"."updateTime" IS '更新时间';

CREATE SEQUENCE IF NOT EXISTS public."projectGitlabRepository_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public."projectGitlabRepository_id_seq"
    OWNED BY public."projectGitlabRepository".id;

ALTER TABLE ONLY public."projectGitlabRepository"
    ALTER COLUMN id SET DEFAULT nextval('public."projectGitlabRepository_id_seq"'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projectGitlabRepository_pkey'
  ) THEN
    ALTER TABLE ONLY public."projectGitlabRepository"
      ADD CONSTRAINT "projectGitlabRepository_pkey" PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_projectGitlabRepository_tenant_project_gitlab'
  ) THEN
    ALTER TABLE ONLY public."projectGitlabRepository"
      ADD CONSTRAINT "uk_projectGitlabRepository_tenant_project_gitlab"
      UNIQUE ("tenantId", "projectId", "gitlabProjectId");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_projectGitlabRepository_tenant_project"
    ON public."projectGitlabRepository" USING btree ("tenantId", "projectId");
