import { Flex } from 'antd';

import { ApiAssetStocktake } from '@/api';
import type { AssetStocktakeTaskItem } from '@/api/modules/asset-stocktake';
import { KTable } from '@/components';
import { useKModal } from '@/components/KModal';
import { PERMISSION_RESOURCE } from '@/constants/permission';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';

import StocktakeCreateModal from './#StocktakeCreateModal';

/**
 * 盘点任务表格。
 */
const StocktakeTaskTable = () => {
  const modal = useKModal();

  return (
    <KTable<AssetStocktakeTaskItem>
      queryKey={queryKey.asset.stocktakeList()}
      request={ApiAssetStocktake.getList}
      rowKey={'id'}
      columns={[
        {
          title: '任务名称',
          dataIndex: 'name',
          key: 'name',
        },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          width: 120,
        },
      ]}
      toolbar={
        <Flex justify={'flex-end'} style={{ width: '100%' }}>
          <KTable.Button
            type={'primary'}
            icon={<Icons.Plus />}
            permissionCode={PERMISSION_RESOURCE.assetStocktakeManage}
            onClick={async () => {
              await modal.open({
                title: '发起盘点',
                width: 640,
                children: <StocktakeCreateModal />,
              });
            }}
          >
            发起盘点
          </KTable.Button>
        </Flex>
      }
    />
  );
};

export default StocktakeTaskTable;
