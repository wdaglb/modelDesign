import React, { useMemo } from 'react';
import { Empty, Flex, Input, Space, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

import { ApiPermissionGroup } from '@/api';
import type { PermissionGroup } from '@/api/modules/permission-group';
import { KTable } from '@/components';
import { useKModal } from '@/components/KModal';
import { PERMISSION_RESOURCE } from '@/constants/permission.ts';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';

import CreatePermissionGroupForm from './#CreatePermissionGroupForm';
import ResourceDrawer from './#ResourceDrawer';
import UpdatePermissionGroupForm from './#UpdatePermissionGroupForm';

/**
 * 资源组信息单元格。
 */
const GroupInfoCell = ({ item }: { item: PermissionGroup }) => {
  return (
    <Space direction={'vertical'} size={0}>
      <Typography.Text strong>{item.name}</Typography.Text>
      <Typography.Text type={'secondary'}>{item.code}</Typography.Text>
      {item.remark ? (
        <Typography.Text type={'secondary'}>{item.remark}</Typography.Text>
      ) : null}
    </Space>
  );
};

/**
 * 权限资源组表格。
 */
const PermissionGroupTable = () => {
  const modal = useKModal();
  const [keyword, setKeyword] = React.useState('');
  const [pagination, setPagination] = React.useState({
    current: 1,
    pageSize: 10,
  });

  const params = useMemo(() => {
    const normalizedKeyword = keyword.trim();
    return {
      ...pagination,
      name: normalizedKeyword || undefined,
      code: normalizedKeyword || undefined,
    };
  }, [keyword, pagination]);

  const columns: TableColumnsType<PermissionGroup> = [
    {
      title: '资源组信息',
      dataIndex: 'name',
      key: 'name',
      render: (_, item) => <GroupInfoCell item={item} />,
    },
    {
      title: '资源组 ID',
      dataIndex: 'id',
      key: 'id',
      width: 140,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'isDisable',
      key: 'isDisable',
      width: 120,
      render: (value: PermissionGroup['isDisable']) => {
        if (value) {
          return <Tag color={'red'}>禁用</Tag>;
        }
        return <Tag color={'green'}>启用</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 340,
      render: (_, record) => {
        let confirmColor: 'green' | 'danger' = 'danger';
        let confirmText = '禁用';
        if (record.isDisable) {
          confirmColor = 'green';
          confirmText = '启用';
        }

        return (
          <Space>
            <KTable.Button
              size={'small'}
              color={'blue'}
              variant={'filled'}
              permissionCode={PERMISSION_RESOURCE.systemPermissionGroupEdit}
              onClick={async () => {
                await modal.open({
                  title: '编辑资源组',
                  width: 520,
                  children: <UpdatePermissionGroupForm record={record} />,
                });
              }}
            >
              编辑
            </KTable.Button>

            <KTable.Button
              size={'small'}
              color={'purple'}
              variant={'filled'}
              icon={<Icons.ShieldEdit />}
              permissionCode={PERMISSION_RESOURCE.systemPermissionGroupResource}
              onClick={async () => {
                await modal.open({
                  title: `配置资源 - ${record.name}`,
                  width: 720,
                  children: <ResourceDrawer group={record} />,
                });
              }}
            >
              配置资源
            </KTable.Button>

            <KTable.ConfirmButton
              size={'small'}
              color={confirmColor}
              variant={'filled'}
              permissionCode={
                PERMISSION_RESOURCE.systemPermissionGroupChangeStatus
              }
              onConfirm={async () => {
                await ApiPermissionGroup.updateStatus({
                  id: record.id,
                  isDisable: !record.isDisable,
                });
              }}
            >
              {confirmText}
            </KTable.ConfirmButton>
          </Space>
        );
      },
    },
  ];

  return (
    <KTable<PermissionGroup>
      queryKey={[...queryKey.permissionGroup.list(), params]}
      request={ApiPermissionGroup.getPageList}
      params={params}
      columns={columns}
      locale={{
        emptyText: (
          <Empty
            description={keyword ? '未找到匹配的资源组' : '暂无资源组数据'}
          />
        ),
      }}
      toolbar={
        <Flex justify={'space-between'} gap={12} wrap style={{ width: '100%' }}>
          <Input.Search
            allowClear
            placeholder={'请输入资源组名称或编码搜索'}
            style={{ width: 260 }}
            onSearch={(value) => {
              setPagination((previous) => {
                return {
                  ...previous,
                  current: 1,
                };
              });
              setKeyword(value);
            }}
          />

          <KTable.Button
            type={'primary'}
            icon={<Icons.Plus />}
            permissionCode={PERMISSION_RESOURCE.systemPermissionGroupCreate}
            onClick={async () => {
              await modal.open({
                title: '新增资源组',
                width: 520,
                children: <CreatePermissionGroupForm />,
              });
            }}
          >
            新增资源组
          </KTable.Button>
        </Flex>
      }
    />
  );
};

export default PermissionGroupTable;
