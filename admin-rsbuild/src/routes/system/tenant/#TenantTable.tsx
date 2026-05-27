import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Empty, Flex, Input, Select, Space, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';

import { ApiTenant } from '@/api';
import type { Tenant } from '@/api/modules/tenant';
import { KTable } from '@/components';
import { useKModal } from '@/components/KModal';
import { PERMISSION_RESOURCE } from '@/constants/permission.ts';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';

import CreateTenantForm from './#CreateTenantForm';
import UpdateTenantForm from './#UpdateTenantForm';

const ALL_STATUS_FILTER_VALUE = 'all';
const ENABLE_STATUS_FILTER_VALUE = 'enabled';
const DISABLE_STATUS_FILTER_VALUE = 'disabled';

/**
 * 租户基础信息单元格。
 */
const TenantInfoCell = ({ item }: { item: Tenant }) => {
  return (
    <Space orientation={'vertical'} size={0}>
      <Space>
        <Typography.Text strong>{item.name}</Typography.Text>
        {item.id === 1 ? <Tag color={'gold'}>默认租户</Tag> : null}
      </Space>
      <Typography.Text type={'secondary'}>{item.code}</Typography.Text>
      {item.description ? (
        <Typography.Text type={'secondary'}>{item.description}</Typography.Text>
      ) : null}
    </Space>
  );
};

/**
 * 解析状态筛选值。
 */
function resolveTenantStatusFilter(value: string) {
  if (value === DISABLE_STATUS_FILTER_VALUE) {
    return true;
  }
  if (value === ENABLE_STATUS_FILTER_VALUE) {
    return false;
  }
  return undefined;
}

/**
 * 租户管理表格。
 */
const TenantTable = () => {
  const modal = useKModal();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS_FILTER_VALUE);

  const params = useMemo(() => {
    const resolvedStatus = resolveTenantStatusFilter(statusFilter);
    const trimmedKeyword = keyword.trim();
    return {
      ...pagination,
      code: trimmedKeyword || undefined,
      name: trimmedKeyword || undefined,
      isDisable: resolvedStatus,
    };
  }, [keyword, pagination, statusFilter]);

  const columns: TableColumnsType<Tenant> = [
    {
      title: '租户信息',
      dataIndex: 'name',
      key: 'name',
      render: (_, item) => <TenantInfoCell item={item} />,
    },
    {
      title: '租户 ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'isDisable',
      key: 'isDisable',
      width: 120,
      render: (value: Tenant['isDisable']) => {
        if (value) {
          return <Tag color={'red'}>禁用</Tag>;
        }
        return <Tag color={'green'}>启用</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => {
        let confirmColor: 'green' | 'danger' = 'danger';
        let confirmText = '禁用';
        if (record.isDisable) {
          confirmColor = 'green';
          confirmText = '启用';
        }

        let disableStatusAction = false;
        if (record.id === 1 && !record.isDisable) {
          disableStatusAction = true;
        }

        return (
          <Space>
            <KTable.Button
              variant={'filled'}
              color={'blue'}
              size={'small'}
              permissionCode={PERMISSION_RESOURCE.systemTenantEdit}
              onClick={async () => {
                await modal.open({
                  title: '修改租户',
                  width: 520,
                  children: <UpdateTenantForm record={record} />,
                });
              }}
            >
              编辑
            </KTable.Button>

            <KTable.ConfirmButton
              variant={'filled'}
              color={confirmColor}
              size={'small'}
              permissionCode={PERMISSION_RESOURCE.systemTenantChangeStatus}
              disabled={disableStatusAction}
              onConfirm={async () => {
                await ApiTenant.updateStatus({
                  id: record.id,
                  isDisable: !record.isDisable,
                });
                await queryClient.invalidateQueries({
                  queryKey: queryKey.tenant.options(),
                });
                await queryClient.invalidateQueries({
                  queryKey: queryKey.user.list(),
                });
                message.success('租户状态修改成功');
              }}
            >
              {confirmText}
            </KTable.ConfirmButton>

            <KTable.ConfirmButton
              variant={'filled'}
              color={'danger'}
              size={'small'}
              permissionCode={PERMISSION_RESOURCE.systemTenantDelete}
              disabled={record.id === 1}
              onConfirm={async () => {
                await ApiTenant.deleteTenant(record.id);
                await queryClient.invalidateQueries({
                  queryKey: queryKey.tenant.options(),
                });
                await queryClient.invalidateQueries({
                  queryKey: queryKey.user.list(),
                });
                message.success('租户删除成功');
              }}
            >
              删除
            </KTable.ConfirmButton>
          </Space>
        );
      },
    },
  ];

  return (
    <KTable<Tenant>
      queryKey={[...queryKey.tenant.list(), params]}
      request={ApiTenant.getPageList}
      params={params}
      columns={columns}
      locale={{
        emptyText: (
          <Empty description={keyword ? '未找到匹配的租户' : '暂无租户数据'} />
        ),
      }}
      toolbar={
        <Flex justify={'space-between'} gap={12} wrap style={{ width: '100%' }}>
          <Space>
            <Input.Search
              allowClear
              placeholder={'请输入租户名称或编码搜索'}
              style={{ width: 260 }}
              onSearch={(value) => {
                setPagination((prev) => ({ ...prev, current: 1 }));
                setKeyword(value);
              }}
            />

            <Select
              value={statusFilter}
              style={{ width: 160 }}
              onChange={(value) => {
                setPagination((prev) => ({ ...prev, current: 1 }));
                setStatusFilter(value);
              }}
              options={[
                { label: '全部状态', value: ALL_STATUS_FILTER_VALUE },
                { label: '启用', value: ENABLE_STATUS_FILTER_VALUE },
                { label: '禁用', value: DISABLE_STATUS_FILTER_VALUE },
              ]}
            />
          </Space>

          <Space>
            <KTable.Button
              type={'primary'}
              icon={<Icons.Plus />}
              permissionCode={PERMISSION_RESOURCE.systemTenantCreate}
              onClick={async () => {
                await modal.open({
                  title: '添加租户',
                  width: 520,
                  children: <CreateTenantForm />,
                });
              }}
            >
              添加租户
            </KTable.Button>
          </Space>
        </Flex>
      }
    />
  );
};

export default TenantTable;
