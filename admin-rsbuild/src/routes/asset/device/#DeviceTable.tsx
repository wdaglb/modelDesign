import { useMemo, useState } from 'react';
import { Empty, Flex, Input, Space } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiAssetDevice } from '@/api';
import type {
  AssetDeviceItem,
  AssetDeviceListParams,
} from '@/api/modules/asset-device';
import { KTable } from '@/components';
import { useKModal } from '@/components/KModal';
import { PERMISSION_RESOURCE } from '@/constants/permission';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';

import DeviceFormModal from './#DeviceFormModal';
import DeviceImportModal from './#DeviceImportModal';
import ReceiveModal from './#ReceiveModal';
import ReturnModal from './#ReturnModal';
import ScrapModal from './#ScrapModal';
import TransferModal from './#TransferModal';

/**
 * 设备台账表格。
 */
const DeviceTable = () => {
  const modal = useKModal();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');

  const params = useMemo<AssetDeviceListParams>(() => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      return {};
    }

    return {
      deviceName: trimmedKeyword,
    };
  }, [keyword]);

  const columns: TableColumnsType<AssetDeviceItem> = [
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      key: 'deviceName',
    },
    {
      title: '资产编号',
      dataIndex: 'assetCode',
      key: 'assetCode',
      width: 180,
    },
    {
      title: 'SN',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      render: (_, record) => {
        return (
          <Space wrap>
            {record.status === 1 ? (
              <KTable.Button
                size={'small'}
                permissionCode={PERMISSION_RESOURCE.assetDeviceReceive}
                onClick={async () => {
                  await modal.open({
                    title: '领用设备',
                    width: 520,
                    children: <ReceiveModal record={record} />,
                  });
                }}
              >
                领用
              </KTable.Button>
            ) : null}

            {record.status === 2 ? (
              <KTable.Button
                size={'small'}
                permissionCode={PERMISSION_RESOURCE.assetDeviceReturn}
                onClick={async () => {
                  await modal.open({
                    title: '归还设备',
                    width: 520,
                    children: <ReturnModal record={record} />,
                  });
                }}
              >
                归还
              </KTable.Button>
            ) : null}

            <KTable.Button
              size={'small'}
              permissionCode={PERMISSION_RESOURCE.assetDeviceTransfer}
              onClick={async () => {
                await modal.open({
                  title: '调拨设备',
                  width: 520,
                  children: <TransferModal record={record} />,
                });
              }}
            >
              调拨
            </KTable.Button>

            <KTable.ConfirmButton
              size={'small'}
              color={'danger'}
              permissionCode={PERMISSION_RESOURCE.assetDeviceScrap}
              confirmText={'确认将该设备报废吗？'}
              successText={'设备报废成功'}
              onConfirm={async () => {
                await ApiAssetDevice.scrap({
                  id: record.id,
                });
                await queryClient.invalidateQueries({
                  queryKey: queryKey.asset.deviceList(),
                });
              }}
            >
              报废
            </KTable.ConfirmButton>
          </Space>
        );
      },
    },
  ];

  return (
    <KTable<AssetDeviceItem>
      queryKey={[...queryKey.asset.deviceList(), params]}
      request={ApiAssetDevice.getList}
      params={params}
      columns={columns}
      rowKey={'id'}
      locale={{
        emptyText: (
          <Empty description={keyword ? '未找到匹配设备' : '暂无设备台账'} />
        ),
      }}
      toolbar={
        <Flex justify={'space-between'} gap={12} wrap style={{ width: '100%' }}>
          <Input.Search
            allowClear
            placeholder={'请输入设备名称搜索'}
            style={{ width: 260 }}
            onSearch={(value) => {
              setKeyword(value);
            }}
          />

          <Space wrap>
            <KTable.Button
              permissionCode={PERMISSION_RESOURCE.assetDeviceManage}
              onClick={async () => {
                await modal.open({
                  title: '批量导入库存',
                  width: 640,
                  children: <DeviceImportModal />,
                });
              }}
            >
              批量导入
            </KTable.Button>

            <KTable.Button
              type={'primary'}
              icon={<Icons.Plus />}
              permissionCode={PERMISSION_RESOURCE.assetDeviceManage}
              onClick={async () => {
                await modal.open({
                  title: '新增入库',
                  width: 640,
                  children: <DeviceFormModal />,
                });
              }}
            >
              新增入库
            </KTable.Button>
          </Space>
        </Flex>
      }
    />
  );
};

export default DeviceTable;
