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
      '/project/task/my-todo',
      '/project/task/list',
      '/project/task/board',
      '/project/task/agile-board',
      '/project/task/detail',
      '/project/task/children',
      '/project/task/children/batch',
      '/project/task/change-log/list',
    ]);
  });

  it('should collect agile board api resources from selected menu resource', () => {
    expect(
      collectAutoApiResourcesByMenuResources([PERMISSION_RESOURCE.agileBoard]),
    ).toEqual(['/project/task/agile-board']);
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

    expect(usageCountMap[PERMISSION_RESOURCE.project]).toBe(2);
    expect(usageCountMap[PERMISSION_RESOURCE.agileBoard]).toBe(1);
    expect(usageCountMap[PERMISSION_RESOURCE.projectTask]).toBe(8);
    expect(usageCountMap[PERMISSION_RESOURCE.projectMemberManage]).toBe(3);
    expect(usageCountMap[PERMISSION_RESOURCE.projectTaskTagManage]).toBe(4);
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

  it('should build usage count map with deduplicated api resources', () => {
    const usageCountMap = buildShortcutApiUsageCountMap();

    expect(usageCountMap[PERMISSION_RESOURCE.systemRolePermission]).toBe(5);
    expect(usageCountMap[PERMISSION_RESOURCE.systemRole]).toBe(1);
    expect(usageCountMap[PERMISSION_RESOURCE.systemPermissionGroupResource]).toBe(4);
  });
});
