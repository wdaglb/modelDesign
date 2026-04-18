import { describe, expect, it } from 'vitest';

import {
  buildShortcutApiUsageCountMap,
  collectAutoApiResourcesByMenuResources,
  collectShortcutApiResources,
  matchPermissionGroupShortcuts,
} from '../permissionGroupShortcut.ts';
import { PERMISSION_RESOURCE } from '../permission.ts';

describe('permissionGroupShortcut', () => {
  it('should match shortcuts by selected button resources', () => {
    const shortcuts = matchPermissionGroupShortcuts([
      PERMISSION_RESOURCE.systemRolePermission,
      PERMISSION_RESOURCE.systemPermissionGroupResource,
    ]);

    expect(shortcuts.map((item) => item.code)).toEqual([
      'SYSTEM_ROLE_PERMISSION_DEPENDENCIES',
      'SYSTEM_PERMISSION_GROUP_RESOURCE_DEPENDENCIES',
    ]);
  });

  it('should collect and deduplicate api resources from matched shortcuts', () => {
    const shortcuts = matchPermissionGroupShortcuts([
      PERMISSION_RESOURCE.systemRolePermission,
      PERMISSION_RESOURCE.systemPermissionGroupResource,
    ]);

    expect(collectShortcutApiResources(shortcuts)).toEqual([
      '/role/permission',
      '/role/permission/update',
      '/permission-group/list',
      '/menu/list',
      '/permission-resource/catalog',
      '/permission-group/resources',
      '/permission-group/resources/update',
    ]);
  });

  it('should return empty shortcuts when no page or button resource matches', () => {
    expect(matchPermissionGroupShortcuts(['/unknown/resource'])).toEqual([]);
  });

  it('should collect project page api resources from selected menu resources', () => {
    expect(
      collectAutoApiResourcesByMenuResources([
        PERMISSION_RESOURCE.project,
        PERMISSION_RESOURCE.projectTask,
      ]),
    ).toEqual([
      '/project/list',
      '/project/detail',
      '/project/create',
      '/project/deleted',
      '/project/edit',
      '/project/task/my-todo',
      '/project/task/list',
      '/project/task/board',
      '/project/task/agile-board',
      '/project/task/detail',
      '/project/task/children',
      '/project/task/children/batch',
      '/project/task/change-log/list',
      '/project/task/dynamic/list',
      '/project/task/dynamic/create',
    ]);
  });

  it('should collect agile board page level api resources from selected menu resource', () => {
    expect(
      collectAutoApiResourcesByMenuResources([PERMISSION_RESOURCE.agileBoard]),
    ).toEqual([
      '/project/task/agile-board',
      '/project/task/dynamic/list',
      '/project/task/dynamic/create',
      '/project/list',
      '/project/task-status/list',
      '/project/task/children/batch',
      '/project/task/detail',
      '/project/task/detail/by-code',
      '/project/task/edit',
    ]);
  });

  it('should collect project operation api resources from selected button resources', () => {
    expect(
      collectAutoApiResourcesByMenuResources([
        PERMISSION_RESOURCE.projectCreate,
        PERMISSION_RESOURCE.projectMemberManage,
        PERMISSION_RESOURCE.projectTaskTagManage,
      ]),
    ).toEqual([
      '/project/create',
      '/project/member/list',
      '/project/member/add',
      '/project/member/delete',
      '/project/task/tag/list',
      '/project/task/tag/create',
      '/project/task/tag/edit',
      '/project/task/tag/deleted',
    ]);
  });

  it('should build usage count map for project resources', () => {
    const usageCountMap = buildShortcutApiUsageCountMap();

    expect(usageCountMap[PERMISSION_RESOURCE.project]).toBe(5);
    expect(usageCountMap[PERMISSION_RESOURCE.agileBoard]).toBe(9);
    expect(usageCountMap[PERMISSION_RESOURCE.projectTask]).toBe(10);
    expect(usageCountMap[PERMISSION_RESOURCE.projectMemberManage]).toBe(3);
    expect(usageCountMap[PERMISSION_RESOURCE.projectTaskTagManage]).toBe(4);
  });

  it('should keep generated menu profile wider than button profile fallback', () => {
    const usageCountMap = buildShortcutApiUsageCountMap();

    expect(usageCountMap[PERMISSION_RESOURCE.systemRole]).toBe(13);
    expect(usageCountMap[PERMISSION_RESOURCE.systemRolePermission]).toBe(5);
    expect(
      usageCountMap[PERMISSION_RESOURCE.systemPermissionGroupResource],
    ).toBe(4);
  });

  it('should collect auto api resources directly from selected menu resources', () => {
    expect(
      collectAutoApiResourcesByMenuResources([
        PERMISSION_RESOURCE.systemRolePermission,
      ]),
    ).toEqual([
      '/role/permission',
      '/role/permission/update',
      '/permission-group/list',
      '/menu/list',
      '/permission-resource/catalog',
    ]);
  });
});
