import { PassportCurrentPermissionMenu } from '@/api/modules/passport.types.ts';
import { PLATFORM_ONLY_PERMISSION_PREFIXES } from '@/constants/permission.ts';

const SHARED_ACCESSIBLE_PATHS = ['/login', '/personal-center'];
const PLATFORM_TENANT_ID = 1;
const SUPER_ADMIN_USER_ID = 1;
const SINGLE_LEVEL_WILDCARD = '*';
const MULTI_LEVEL_WILDCARD = '**';

/**
 * 统一整理路径，避免尾部斜杠导致的权限判断偏差。
 */
export function normalizePermissionPath(path: string) {
  if (!path) {
    return '/';
  }

  let normalizedPath = path.trim();
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }
  if (normalizedPath !== '/' && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  return normalizedPath;
}

/**
 * 判断资源格式是否合法。
 *
 * 只允许整段路径使用 `*` 或 `**`，避免出现 `abc*def` 这类难以维护的规则。
 */
export function isValidPermissionPattern(resource: string) {
  const normalizedResource = normalizePermissionPath(resource);
  const segments = splitPermissionSegments(normalizedResource);

  for (const segment of segments) {
    if (
      segment.includes(SINGLE_LEVEL_WILDCARD) &&
      segment !== SINGLE_LEVEL_WILDCARD &&
      segment !== MULTI_LEVEL_WILDCARD
    ) {
      return false;
    }
  }
  return true;
}

/**
 * 按统一通配规则匹配权限资源。
 *
 * `*` 支持零段或一段，`**` 支持零段到多段，
 * 这样 `/project/*` 与 `/project/**` 都天然包含父路径 `/project`。
 */
export function matchPermissionResource(pattern: string, resource: string) {
  if (!pattern || !resource) {
    return false;
  }

  const normalizedPattern = normalizePermissionPath(pattern);
  const normalizedResource = normalizePermissionPath(resource);
  if (!isValidPermissionPattern(normalizedPattern)) {
    return false;
  }
  if (!isValidPermissionPattern(normalizedResource)) {
    return false;
  }

  const patternSegments = splitPermissionSegments(normalizedPattern);
  const resourceSegments = splitPermissionSegments(normalizedResource);
  return matchSegments(patternSegments, 0, resourceSegments, 0);
}

/**
 * 判断按钮权限是否命中。
 */
export function hasButtonPermission(buttons: string[], permissionCode?: string) {
  if (!permissionCode) {
    return true;
  }
  for (const button of buttons) {
    if (matchPermissionResource(button, permissionCode)) {
      return true;
    }
  }
  return false;
}

/**
 * 判断资源是否属于平台级权限。
 */
export function isPlatformOnlyPermission(resource: string) {
  const normalizedResource = normalizePermissionPath(resource);
  for (const prefix of PLATFORM_ONLY_PERMISSION_PREFIXES) {
    if (normalizedResource === prefix) {
      return true;
    }
    if (normalizedResource.startsWith(`${prefix}/`)) {
      return true;
    }
  }
  return false;
}

/**
 * 判断当前路径是否允许访问。
 */
export function canAccessPath(
  menus: PassportCurrentPermissionMenu[],
  pathname: string,
) {
  const normalizedPath = normalizePermissionPath(pathname);
  if (SHARED_ACCESSIBLE_PATHS.includes(normalizedPath)) {
    return true;
  }

  for (const menu of menus) {
    const menuPath = normalizePermissionPath(menu.name);
    if (normalizedPath === menuPath) {
      return true;
    }
    if (normalizedPath.startsWith(`${menuPath}/`)) {
      return true;
    }
    if (matchPermissionResource(menuPath, normalizedPath)) {
      return true;
    }
  }
  return false;
}

/**
 * 获取当前用户可跳转的首个菜单路径。
 */
export function getFirstAccessiblePath(menus: PassportCurrentPermissionMenu[]) {
  for (const menu of menus) {
    const menuPath = normalizePermissionPath(menu.name);
    if (menuPath !== '/') {
      return menuPath;
    }
  }
  return '/personal-center';
}

/**
 * 过滤当前租户允许分配的权限节点。
 */
export function filterAssignableMenuNodes<T extends { name: string }>(
  menus: T[],
  tenantId?: number,
  userId?: number,
) {
  if (userId === SUPER_ADMIN_USER_ID) {
    return menus;
  }
  if (tenantId === PLATFORM_TENANT_ID) {
    return menus;
  }

  const result: T[] = [];
  for (const menu of menus) {
    if (isPlatformOnlyPermission(menu.name)) {
      continue;
    }
    result.push(menu);
  }
  return result;
}

/**
 * 拆分权限路径段。
 */
function splitPermissionSegments(path: string) {
  if (path === '/') {
    return [];
  }

  return path
    .slice(1)
    .split('/')
    .filter(Boolean);
}

/**
 * 递归匹配路径段。
 */
function matchSegments(
  patternSegments: string[],
  patternIndex: number,
  resourceSegments: string[],
  resourceIndex: number,
): boolean {
  if (patternIndex >= patternSegments.length) {
    return resourceIndex >= resourceSegments.length;
  }

  const patternSegment = patternSegments[patternIndex];
  if (patternSegment === MULTI_LEVEL_WILDCARD) {
    for (let index = resourceIndex; index <= resourceSegments.length; index += 1) {
      if (
        matchSegments(
          patternSegments,
          patternIndex + 1,
          resourceSegments,
          index,
        )
      ) {
        return true;
      }
    }
    return false;
  }

  if (patternSegment === SINGLE_LEVEL_WILDCARD) {
    if (
      matchSegments(
        patternSegments,
        patternIndex + 1,
        resourceSegments,
        resourceIndex,
      )
    ) {
      return true;
    }
    if (resourceIndex < resourceSegments.length) {
      return matchSegments(
        patternSegments,
        patternIndex + 1,
        resourceSegments,
        resourceIndex + 1,
      );
    }
    return false;
  }

  if (resourceIndex >= resourceSegments.length) {
    return false;
  }
  if (patternSegment !== resourceSegments[resourceIndex]) {
    return false;
  }
  return matchSegments(
    patternSegments,
    patternIndex + 1,
    resourceSegments,
    resourceIndex + 1,
  );
}
