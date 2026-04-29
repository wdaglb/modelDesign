import { Flex, Space, message } from 'antd';

import { ApiAssetStocktake } from '@/api';
import type { AssetStocktakeTaskItem } from '@/api/modules/asset-stocktake';
import { KTable } from '@/components';
import { useKDrawer } from '@/components/KDrawer';
import { useKModal } from '@/components/KModal';
import { PERMISSION_RESOURCE } from '@/constants/permission';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';

import StocktakeCreateModal from './#StocktakeCreateModal';
import StocktakeDetailDrawer from './#StocktakeDetailDrawer';
import { getTaskStatusTag } from './#stocktakeDisplay';

/**
 * 获取盘点进度展示文案。
 *
 * @param record 盘点任务
 * @returns 进度文本
 */
function getProgressText(record: AssetStocktakeTaskItem) {
  const checkedCount = record.checkedCount ?? 0;
  const totalCount = record.totalCount ?? 0;
  return `${checkedCount}/${totalCount}`;
}

/**
 * 盘点任务表格。
 */
const StocktakeTaskTable = () => {
  const modal = useKModal();
  const drawer = useKDrawer();

  /**
   * 打开盘点任务详情抽屉。
   *
   * @param record 当前任务
   */
  const openDetailDrawer = (record: AssetStocktakeTaskItem) => {
    drawer
      .open({
        title: '盘点任务详情',
        width: 980,
        children: <StocktakeDetailDrawer record={record} />,
      })
      .catch((error) => {
        if (error === 'KDrawer cancel') {
          return;
        }

        message.error('打开盘点任务详情失败，请稍后重试');
      });
  };

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
          render: (value) => getTaskStatusTag(value),
        },
        {
          title: '盘点进度',
          key: 'progress',
          width: 120,
          render: (_, record) => getProgressText(record),
        },
        {
          title: '盘到',
          dataIndex: 'foundCount',
          key: 'foundCount',
          width: 100,
        },
        {
          title: '未找到',
          dataIndex: 'missingCount',
          key: 'missingCount',
          width: 100,
        },
        {
          title: '操作',
          key: 'action',
          width: 220,
          render: (_, record) => (
            <Space>
              <KTable.Button
                size={'small'}
                permissionCode={PERMISSION_RESOURCE.assetStocktakeManage}
                onClick={async () => {
                  openDetailDrawer(record);
                }}
              >
                查看盘点
              </KTable.Button>
              <KTable.Button
                size={'small'}
                permissionCode={PERMISSION_RESOURCE.assetStocktakeManage}
                onClick={async () => {
                  try {
                    await ApiAssetStocktake.exportDetail(record.id, record.name);
                  } catch {
                    message.error('导出盘点结果失败，请稍后重试');
                  }
                }}
              >
                导出结果
              </KTable.Button>
            </Space>
          ),
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
