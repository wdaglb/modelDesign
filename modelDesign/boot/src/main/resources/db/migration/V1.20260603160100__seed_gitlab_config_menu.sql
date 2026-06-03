/**
 * 新增 GitLab 配置菜单和租户管理员权限。
 *
 * GitLab Token 属于租户私有敏感配置，本迁移只补齐租户管理员和平台管理员
 * 可见入口及接口权限，不对普通用户开放配置能力。
 */

INSERT INTO public.menu (
    "parentId",
    name,
    title,
    "iconType",
    "iconValue",
    path,
    sort,
    status,
    "nodeType"
)
SELECT
    COALESCE((SELECT id FROM public.menu WHERE name = '/system/third-party'), 0),
    '/system/third-party/gitlab',
    'GitLab 配置',
    'mdi',
    'mdi:gitlab',
    '/system/third-party/gitlab',
    20,
    1,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM public.menu
    WHERE name = '/system/third-party/gitlab'
);

UPDATE public.menu
SET
    "parentId" = COALESCE((SELECT id FROM public.menu WHERE name = '/system/third-party'), 0),
    title = 'GitLab 配置',
    "iconType" = 'mdi',
    "iconValue" = 'mdi:gitlab',
    path = '/system/third-party/gitlab',
    sort = 20,
    status = 1,
    "nodeType" = 0,
    "updateTime" = CURRENT_TIMESTAMP
WHERE name = '/system/third-party/gitlab';

WITH button_seed(parent_name, name, title, sort) AS (
    VALUES
        ('/system/third-party/gitlab', '/system/third-party/gitlab/save', '保存配置', 100),
        ('/system/third-party/gitlab', '/system/third-party/gitlab/test-connection', '测试连接', 200),
        ('/system/third-party/gitlab', '/system/third-party/gitlab/projects', '查看项目列表', 300)
),
resolved_seed AS (
    SELECT
        parent.id AS parent_id,
        seed.name,
        seed.title,
        seed.sort
    FROM button_seed seed
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
    1,
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
        '/system/third-party/gitlab',
        '/system/third-party/gitlab/save',
        '/system/third-party/gitlab/test-connection',
        '/system/third-party/gitlab/projects'
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
        '/system/third-party/gitlab',
        '/system/third-party/gitlab/save',
        '/system/third-party/gitlab/test-connection',
        '/system/third-party/gitlab/projects'
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
