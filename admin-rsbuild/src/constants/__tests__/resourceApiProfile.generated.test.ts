import { describe, expect, it } from 'vitest';

import {
  GENERATED_BUTTON_RESOURCE_API_PROFILE,
  GENERATED_MENU_RESOURCE_API_PROFILE,
} from '../resourceApiProfile.generated.ts';
import { PERMISSION_RESOURCE } from '../permission.ts';

describe('resourceApiProfile.generated', () => {
  it('should collect role page menu resource apis', () => {
    expect(GENERATED_MENU_RESOURCE_API_PROFILE[PERMISSION_RESOURCE.systemRole]).toEqual([
      '/menu/list',
      '/permission-group/list',
      '/permission-resource/catalog',
      '/role/add',
      '/role/batch_update_status',
      '/role/list',
      '/role/permission',
      '/role/permission/update',
      '/role/update',
      '/role/update_status',
      '/role/users',
      '/role/users/update',
      '/user/list',
    ]);
  });

  it('should keep permission group page dependencies in generated menu profile', () => {
    expect(
      GENERATED_MENU_RESOURCE_API_PROFILE[PERMISSION_RESOURCE.systemPermissionGroup],
    ).toEqual([
      '/menu/list',
      '/permission-group/add',
      '/permission-group/delete',
      '/permission-group/list',
      '/permission-group/resources',
      '/permission-group/resources/update',
      '/permission-group/update',
      '/permission-group/update_status',
      '/permission-resource/catalog',
    ]);
  });

  it('should expose generated button profile object', () => {
    expect(GENERATED_BUTTON_RESOURCE_API_PROFILE).toBeDefined();
    expect(typeof GENERATED_BUTTON_RESOURCE_API_PROFILE).toBe('object');
  });
});
