import { describe, expect, it } from 'vitest';

import {
  PERMISSION_RESOURCE,
  PLATFORM_ONLY_PERMISSION_PREFIXES,
} from '@/constants/permission.ts';
import type { PassportCurrentPermissionMenu } from '@/api/modules/passport.types.ts';
import {
  canAccessPath,
  filterAssignableMenuNodes,
  getFirstAccessiblePath,
  hasButtonPermission,
  isPlatformOnlyPermission,
  matchPermissionResource,
} from '@/utils/permission.ts';

const menus: PassportCurrentPermissionMenu[] = [
  {
    id: 1,
    parentId: 0,
    name: PERMISSION_RESOURCE.systemUser,
    title: '用户管理',
    iconType: 'mdi',
    iconValue: 'mdi:account',
  },
  {
    id: 2,
    parentId: 1,
    name: '/project',
    title: '项目管理',
    iconType: 'mdi',
    iconValue: 'mdi:folder',
  },
];

describe('permission utils', () => {
  it('should support prefix based route access', () => {
    expect(canAccessPath(menus, '/project/123')).toBe(true);
    expect(canAccessPath(menus, '/system/tenant')).toBe(false);
    expect(canAccessPath(menus, '/personal-center')).toBe(true);
  });

  it('should match wildcard resources', () => {
    expect(matchPermissionResource('/project/*', '/project')).toBe(true);
    expect(matchPermissionResource('/project/*', '/project/create')).toBe(true);
    expect(matchPermissionResource('/project/*', '/project/task/edit')).toBe(
      false,
    );
    expect(matchPermissionResource('/project/**', '/project/task/edit')).toBe(
      true,
    );
  });

  it('should return first accessible menu path', () => {
    expect(getFirstAccessiblePath(menus)).toBe(PERMISSION_RESOURCE.systemUser);
    expect(getFirstAccessiblePath([])).toBe('/personal-center');
  });

  it('should identify platform only permissions', () => {
    expect(isPlatformOnlyPermission(PERMISSION_RESOURCE.systemTenant)).toBe(true);
    expect(
      isPlatformOnlyPermission(PERMISSION_RESOURCE.systemTenantCreate),
    ).toBe(true);
    expect(isPlatformOnlyPermission(PERMISSION_RESOURCE.systemUser)).toBe(false);
    expect(PLATFORM_ONLY_PERMISSION_PREFIXES.length).toBeGreaterThan(0);
  });

  it('should filter assignable menu nodes and button permissions', () => {
    const assignableMenus = filterAssignableMenuNodes(
      [
        { name: PERMISSION_RESOURCE.systemMenu },
        { name: PERMISSION_RESOURCE.systemUser },
        { name: PERMISSION_RESOURCE.systemTenantCreate },
      ],
      2002,
    );

    expect(assignableMenus).toEqual([{ name: PERMISSION_RESOURCE.systemUser }]);
    expect(
      hasButtonPermission(
        [PERMISSION_RESOURCE.systemUserCreate],
        PERMISSION_RESOURCE.systemUserCreate,
      ),
    ).toBe(true);
    expect(
      hasButtonPermission(
        [PERMISSION_RESOURCE.projectTaskEdit],
        '/project/task/123/edit',
      ),
    ).toBe(false);
    expect(
      hasButtonPermission(
        ['/project/**'],
        '/project/task/123/edit',
      ),
    ).toBe(true);
    expect(
      hasButtonPermission(
        [PERMISSION_RESOURCE.systemUserCreate],
        PERMISSION_RESOURCE.systemUserEdit,
      ),
    ).toBe(false);

    expect(
      filterAssignableMenuNodes(
        [{ name: PERMISSION_RESOURCE.systemTenantCreate }],
        2002,
        1,
      ),
    ).toEqual([{ name: PERMISSION_RESOURCE.systemTenantCreate }]);
  });
});
