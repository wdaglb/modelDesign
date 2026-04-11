import { PassportCurrentPermissionMenu } from '@/api/modules/passport.types.ts';
import { PLATFORM_ONLY_PERMISSION_PREFIXES } from '@/constants/permission.ts';

const SHARED_ACCESSIBLE_PATHS = ['/login', '/personal-center'];
const PLATFORM_TENANT_ID = 1;
const SUPER_ADMIN_USER_ID = 1;

/**
 * 统一整理路径，避免尾部斜杠导致的权限判断偏差。
 */
export function normalizePermissionPath(path: string) {
  if (!path) {
    return '/';
  }
  if (path !== '/' && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
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
 *
 * 页面访问判定采用“菜单前缀命中”的策略，
 * 这样 `/project/123` 这类业务内页可以复用 `/project` 的菜单权限。
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
 * 判断按钮权限是否命中。
 */
export function hasButtonPermission(buttons: string[], permissionCode?: string) {
  if (!permissionCode) {
    return true;
  }
  return buttons.includes(permissionCode);
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
