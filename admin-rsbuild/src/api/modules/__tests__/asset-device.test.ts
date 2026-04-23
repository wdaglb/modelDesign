import { describe, expect, it } from 'vitest';

import queryKey from '@/constants/queryKey';
import { PERMISSION_RESOURCE } from '@/constants/permission';

describe('asset constants', () => {
  it('should expose asset query keys and permissions', () => {
    expect(queryKey.asset.deviceList()).toEqual(['assetDeviceList']);
    expect(PERMISSION_RESOURCE.assetDevice).toBe('/asset/device');
    expect(PERMISSION_RESOURCE.assetStocktakeManage).toBe(
      '/asset/stocktake/manage',
    );
  });
});
