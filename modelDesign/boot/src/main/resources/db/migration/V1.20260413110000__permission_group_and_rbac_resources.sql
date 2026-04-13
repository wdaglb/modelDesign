/**
 * 新增权限资源组体系，并补齐项目、任务、文件配置、资源组管理相关权限资源。
 *
 * 设计意图：
 * 1. 资源组由平台统一维护，角色在租户维度绑定资源组与直接资源。
 * 2. 菜单树继续承载具体资源节点，资源组不混入菜单树。
 * 3. 默认平台管理员自动拥有全部新增资源，租户管理员拥有非平台级新增资源。
 */

CREATE TABLE IF NOT EXISTS public.permission_group (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(100) NOT NULL,
    remark character varying(255) DEFAULT ''::character varying NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.permission_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.permission_group_id_seq OWNED BY public.permission_group.id;

ALTER TABLE ONLY public.permission_group
    ALTER COLUMN id SET DEFAULT nextval('public.permission_group_id_seq'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'permission_group_pkey'
  ) THEN
    ALTER TABLE ONLY public.permission_group
      ADD CONSTRAINT permission_group_pkey PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_permission_group_code'
  ) THEN
    ALTER TABLE ONLY public.permission_group
      ADD CONSTRAINT uk_permission_group_code UNIQUE (code);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_permission_group_status
    ON public.permission_group USING btree (status);

CREATE TABLE IF NOT EXISTS public.permission_group_resource (
    id bigint NOT NULL,
    "groupId" bigint NOT NULL,
    resource character varying(200) NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.permission_group_resource_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.permission_group_resource_id_seq
    OWNED BY public.permission_group_resource.id;

ALTER TABLE ONLY public.permission_group_resource
    ALTER COLUMN id SET DEFAULT nextval('public.permission_group_resource_id_seq'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'permission_group_resource_pkey'
  ) THEN
    ALTER TABLE ONLY public.permission_group_resource
      ADD CONSTRAINT permission_group_resource_pkey PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_permission_group_resource'
  ) THEN
    ALTER TABLE ONLY public.permission_group_resource
      ADD CONSTRAINT uk_permission_group_resource UNIQUE ("groupId", resource);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_permission_group_resource_group
    ON public.permission_group_resource USING btree ("groupId");

CREATE TABLE IF NOT EXISTS public.role_permission_group (
    id bigint NOT NULL,
    "tenantId" bigint NOT NULL,
    "roleCode" character varying(64) NOT NULL,
    "groupCode" character varying(100) NOT NULL,
    "createTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updateTime" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS public.role_permission_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.role_permission_group_id_seq
    OWNED BY public.role_permission_group.id;

ALTER TABLE ONLY public.role_permission_group
    ALTER COLUMN id SET DEFAULT nextval('public.role_permission_group_id_seq'::regclass);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'role_permission_group_pkey'
  ) THEN
    ALTER TABLE ONLY public.role_permission_group
      ADD CONSTRAINT role_permission_group_pkey PRIMARY KEY (id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_role_permission_group'
  ) THEN
    ALTER TABLE ONLY public.role_permission_group
      ADD CONSTRAINT uk_role_permission_group UNIQUE ("tenantId", "roleCode", "groupCode");
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_role_permission_group_role
    ON public.role_permission_group USING btree ("tenantId", "roleCode");

WITH menu_seed(parent_name, name, title, node_type, sort) AS (
    VALUES
        ('/system', '/system/permission-group', '权限资源组', 0, 65),
        ('/system/file-config', '/system/file/access-config/save', '保存配置', 1, 100),
        ('/system/permission-group', '/permission-group/add', '创建资源组', 1, 100),
        ('/system/permission-group', '/permission-group/update', '编辑资源组', 1, 200),
        ('/system/permission-group', '/permission-group/update_status', '状态切换', 1, 300),
        ('/system/permission-group', '/permission-group/resources/update', '配置资源', 1, 400),
        ('/project', '/project/create', '创建项目', 1, 100),
        ('/project', '/project/edit', '编辑项目', 1, 200),
        ('/project', '/project/deleted', '删除项目', 1, 300),
        ('/project', '/project/member/*', '管理项目成员', 1, 400),
        ('/project', '/project/task', '访问任务数据', 1, 500),
        ('/project', '/project/task/create', '创建任务', 1, 600),
        ('/project', '/project/task/edit', '编辑任务', 1, 700),
        ('/project', '/project/task/deleted', '删除任务', 1, 800),
        ('/project', '/project/task/member/*', '管理任务成员', 1, 900),
        ('/project', '/project/task-status/save', '保存任务状态配置', 1, 1000),
        ('/project', '/project/task/tag/*', '管理任务标签', 1, 1100),
        ('/ai/chat', '/ai/chat/messages', '发送消息', 1, 100)
),
resolved_seed AS (
    SELECT
        parent.id AS parent_id,
        seed.name,
        seed.title,
        seed.node_type,
        seed.sort
    FROM menu_seed seed
    INNER JOIN public.menu parent
        ON parent.name = seed.parent_name
)
INSERT INTO public.menu (
    "parentId",
    name,
    title,
    "nodeType",
    "iconType",
    "iconValue",
    path,
    sort,
    status
)
SELECT
    resolved_seed.parent_id,
    resolved_seed.name,
    resolved_seed.title,
    resolved_seed.node_type,
    'none',
    '',
    resolved_seed.name,
    resolved_seed.sort,
    1
FROM resolved_seed
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu existing
    WHERE existing.name = resolved_seed.name
);

INSERT INTO public.casbin_rule (ptype, v0, v1, v2, v3)
SELECT
    'p',
    role.code,
    role."tenantId"::character varying,
    'menu',
    menu.name
FROM public.role role
INNER JOIN public.menu menu
    ON menu.name IN (
        '/system/permission-group',
        '/system/file/access-config/save',
        '/permission-group/add',
        '/permission-group/update',
        '/permission-group/update_status',
        '/permission-group/resources/update',
        '/project/create',
        '/project/edit',
        '/project/deleted',
        '/project/member/*',
        '/project/task',
        '/project/task/create',
        '/project/task/edit',
        '/project/task/deleted',
        '/project/task/member/*',
        '/project/task-status/save',
        '/project/task/tag/*',
        '/ai/chat/messages'
    )
WHERE role."tenantId" = 1
  AND role.code IN ('super', 'admin')
  AND NOT EXISTS (
    SELECT 1
    FROM public.casbin_rule existing
    WHERE existing.ptype = 'p'
      AND existing.v0 = role.code
      AND existing.v1 = role."tenantId"::character varying
      AND existing.v2 = 'menu'
      AND existing.v3 = menu.name
  );

INSERT INTO public.casbin_rule (ptype, v0, v1, v2, v3)
SELECT
    'p',
    role.code,
    role."tenantId"::character varying,
    'menu',
    menu.name
FROM public.role role
INNER JOIN public.menu menu
    ON menu.name IN (
        '/system/file/access-config/save',
        '/project/create',
        '/project/edit',
        '/project/deleted',
        '/project/member/*',
        '/project/task',
        '/project/task/create',
        '/project/task/edit',
        '/project/task/deleted',
        '/project/task/member/*',
        '/project/task-status/save',
        '/project/task/tag/*',
        '/ai/chat/messages'
    )
WHERE role.code = 'tenant'
  AND NOT EXISTS (
    SELECT 1
    FROM public.casbin_rule existing
    WHERE existing.ptype = 'p'
      AND existing.v0 = role.code
      AND existing.v1 = role."tenantId"::character varying
      AND existing.v2 = 'menu'
      AND existing.v3 = menu.name
  );
