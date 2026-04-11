/**
 * 为角色与 Casbin 权限关系补齐租户域，并补充系统管理模块的按钮资源节点。
 *
 * 设计意图：
 * 1. 角色改为“租户内唯一”，避免不同租户之间共用同一角色编码。
 * 2. Casbin 策略改为“主体 + 租户域 + 资源”的四段结构，支撑租户内 RBAC。
 * 3. 菜单树继续承载页面与按钮资源，便于前后端共用同一份授权资源。
 */

ALTER TABLE public.role
    ADD COLUMN IF NOT EXISTS "tenantId" bigint;

UPDATE public.role
SET "tenantId" = 1
WHERE "tenantId" IS NULL;

ALTER TABLE public.role
    ALTER COLUMN "tenantId" SET DEFAULT 1;

ALTER TABLE public.role
    ALTER COLUMN "tenantId" SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_role_code'
  ) THEN
    ALTER TABLE public.role
      DROP CONSTRAINT uk_role_code;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_role_tenant_code'
  ) THEN
    ALTER TABLE public.role
      ADD CONSTRAINT uk_role_tenant_code UNIQUE ("tenantId", code);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_role_tenantId" ON public.role USING btree ("tenantId");
CREATE INDEX IF NOT EXISTS idx_role_tenant_status ON public.role USING btree ("tenantId", status);

UPDATE public.casbin_rule
SET v3 = v2,
    v2 = v1,
    v1 = '1'
WHERE ptype = 'p'
  AND v3 IS NULL
  AND v2 IS NOT NULL;

UPDATE public.casbin_rule
SET v2 = '1'
WHERE ptype = 'g'
  AND v2 IS NULL
  AND v1 IS NOT NULL;

WITH button_seed(parent_name, name, title, sort) AS (
    VALUES
        ('/system/menu', '/system/menu/create', '创建菜单', 100),
        ('/system/menu', '/system/menu/edit', '编辑菜单', 200),
        ('/system/menu', '/system/menu/delete', '删除菜单', 300),
        ('/system/menu', '/system/menu/sort', '菜单排序', 400),
        ('/system/role', '/system/role/create', '创建角色', 100),
        ('/system/role', '/system/role/edit', '编辑角色', 200),
        ('/system/role', '/system/role/permission', '权限配置', 300),
        ('/system/role', '/system/role/bind-user', '绑定用户', 400),
        ('/system/role', '/system/role/change-status', '状态切换', 500),
        ('/system/role', '/system/role/batch-change-status', '批量状态切换', 600),
        ('/system/user', '/system/user/create', '创建用户', 100),
        ('/system/user', '/system/user/edit', '编辑用户', 200),
        ('/system/user', '/system/user/bind-role', '绑定角色', 300),
        ('/system/user', '/system/user/bind-position', '绑定职位', 400),
        ('/system/user', '/system/user/change-status', '状态切换', 500),
        ('/system/user', '/system/user/batch-change-status', '批量状态切换', 600),
        ('/system/position', '/system/position/create', '创建职位', 100),
        ('/system/position', '/system/position/edit', '编辑职位', 200),
        ('/system/position', '/system/position/delete', '删除职位', 300),
        ('/system/position', '/system/position/change-status', '状态切换', 400),
        ('/system/position', '/system/position/batch-change-status', '批量状态切换', 500),
        ('/system/tenant', '/system/tenant/create', '创建租户', 100),
        ('/system/tenant', '/system/tenant/edit', '编辑租户', 200),
        ('/system/tenant', '/system/tenant/delete', '删除租户', 300),
        ('/system/tenant', '/system/tenant/change-status', '状态切换', 400),
        ('/system/third-party/qywork', '/system/third-party/qywork/save', '保存配置', 100)
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
    ON menu.status = 1
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
    ON menu.status = 1
WHERE role.code = 'tenant'
  AND menu.name NOT LIKE '/system/menu%'
  AND menu.name NOT LIKE '/system/tenant%'
  AND NOT EXISTS (
    SELECT 1
    FROM public.casbin_rule existing
    WHERE existing.ptype = 'p'
      AND existing.v0 = role.code
      AND existing.v1 = role."tenantId"::character varying
      AND existing.v2 = 'menu'
      AND existing.v3 = menu.name
  );
