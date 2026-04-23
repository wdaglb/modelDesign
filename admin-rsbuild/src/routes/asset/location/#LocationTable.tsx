import { Flex } from 'antd';

import { ApiAssetLocation } from '@/api';
import type { AssetLocationItem } from '@/api/modules/asset-location';
import { KTable } from '@/components';
import { useKModal } from '@/components/KModal';
import { PERMISSION_RESOURCE } from '@/constants/permission';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';

import LocationFormModal from './#LocationFormModal';

/**
 * 设备位置表格。
 */
const LocationTable = () => {
  const modal = useKModal();

  return (
    <KTable<AssetLocationItem>
      queryKey={queryKey.asset.locationList()}
      request={ApiAssetLocation.getList}
      rowKey={'id'}
      columns={[
        {
          title: '位置名称',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: '位置编码',
          dataIndex: 'code',
          key: 'code',
          width: 180,
        },
      ]}
      toolbar={
        <Flex justify={'flex-end'} style={{ width: '100%' }}>
          <KTable.Button
            type={'primary'}
            icon={<Icons.Plus />}
            permissionCode={PERMISSION_RESOURCE.assetLocationManage}
            onClick={async () => {
              await modal.open({
                title: '新建位置',
                width: 520,
                children: <LocationFormModal />,
              });
            }}
          >
            新建位置
          </KTable.Button>
        </Flex>
      }
    />
  );
};

export default LocationTable;
