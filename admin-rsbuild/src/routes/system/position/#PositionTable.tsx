import React, { Key, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Empty, Flex, Input, Select, Space, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

import { ApiPosition, ApiTenant } from '@/api';
import type { Position } from '@/api/modules/position';
import { KTable } from '@/components';
import { useKModal } from '@/components/KModal';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';

import BatchUpdateForm from './#BatchUpdateForm';
import CreatePositionForm from './#CreatePositionForm';
import { buildTenantSelectOptions, getPositionTenantText } from './#tenantHelper';
import UpdatePositionForm from './#UpdatePositionForm';

/**
 * 职位基础信息单元格。
 */
const PositionInfoCell = ({ item }: { item: Position }) => {
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
 * 职位管理表格。
 */
const PositionTable = () => {
  const modal = useKModal();
  const queryClient = useQueryClient();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [keyword, setKeyword] = useState('');
  const [tenantId, setTenantId] = useState<number>();

  const { data: tenantOptionsData = [], isLoading: tenantLoading } = useQuery({
    queryKey: queryKey.tenant.options(),
    queryFn: ApiTenant.getOptions,
  });

  const tenantOptions = buildTenantSelectOptions(tenantOptionsData);

  const params = useMemo(() => {
    const trimmedKeyword = keyword.trim();
    return {
      ...pagination,
      name: trimmedKeyword || undefined,
      code: trimmedKeyword || undefined,
      tenantId,
    };
  }, [keyword, pagination, tenantId]);

  const columns: TableColumnsType<Position> = [
    {
      title: '职位信息',
      dataIndex: 'name',
      key: 'name',
      render: (_, item) => <PositionInfoCell item={item} />,
    },
    {
      title: '职位 ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '所属租户',
      dataIndex: 'tenantName',
      key: 'tenantName',
      width: 220,
      render: (_, record) => {
        return getPositionTenantText(record);
      },
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
      render: (value: Position['isDisable']) => {
        if (value) {
          return <Tag color={'red'}>禁用</Tag>;
        }
        return <Tag color={'green'}>启用</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
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
              variant={'filled'}
              color={'blue'}
              size={'small'}
              onClick={async () => {
                await modal.open({
                  title: '修改职位',
                  width: 560,
                  children: <UpdatePositionForm record={record} />,
                });
              }}
            >
              编辑
            </KTable.Button>

            <KTable.ConfirmButton
              variant={'filled'}
              color={confirmColor}
              size={'small'}
              onConfirm={async () => {
                await ApiPosition.updateStatus({
                  id: record.id,
                  isDisable: !record.isDisable,
                });
                await queryClient.invalidateQueries({
                  queryKey: queryKey.position.list(),
                });
              }}
              successText={'职位状态修改成功'}
            >
              {confirmText}
            </KTable.ConfirmButton>

            <KTable.ConfirmButton
              variant={'filled'}
              color={'danger'}
              size={'small'}
              confirmText={'删除后将自动解除该职位与所有用户的绑定关系，且不可恢复，是否继续？'}
              onConfirm={async () => {
                await ApiPosition.deletePosition(record.id);
                await queryClient.invalidateQueries({
                  queryKey: queryKey.position.list(),
                });
              }}
              successText={'职位删除成功'}
            >
              删除
            </KTable.ConfirmButton>
          </Space>
        );
      },
    },
  ];

  return (
    <KTable<Position>
      queryKey={[...queryKey.position.list(), params]}
      request={ApiPosition.getPageList}
      params={params}
      columns={columns}
      rowSelection={{
        selectedRowKeys,
        onChange: setSelectedRowKeys,
      }}
      locale={{
        emptyText: (
          <Empty description={keyword ? '未找到匹配的职位' : '暂无职位数据'} />
        ),
      }}
      toolbar={
        <Flex justify={'space-between'} gap={12} wrap style={{ width: '100%' }}>
          <Space>
            <Input.Search
              allowClear
              placeholder={'请输入职位名称或编码搜索'}
              style={{ width: 260 }}
              onSearch={(value) => {
                setPagination((prev) => ({ ...prev, current: 1 }));
                setKeyword(value);
              }}
            />

            <Select
              allowClear
              showSearch
              loading={tenantLoading}
              options={tenantOptions}
              placeholder={'按租户筛选'}
              style={{ width: 220 }}
              optionFilterProp={'label'}
              value={tenantId}
              onChange={(value) => {
                setPagination((prev) => ({ ...prev, current: 1 }));
                if (typeof value === 'number') {
                  setTenantId(value);
                  return;
                }
                setTenantId(undefined);
              }}
            />
          </Space>

          <Space>
            <KTable.Button
              type={'primary'}
              icon={<Icons.Plus />}
              onClick={async () => {
                await modal.open({
                  title: '添加职位',
                  width: 560,
                  children: <CreatePositionForm />,
                });
              }}
            >
              添加职位
            </KTable.Button>

            <KTable.Button
              disabled={selectedRowKeys.length === 0}
              onClick={async () => {
                await modal.open({
                  title: '批量修改状态',
                  width: 480,
                  children: (
                    <BatchUpdateForm
                      ids={selectedRowKeys
                        .map((item) => Number(item))
                        .filter(Boolean)}
                    />
                  ),
                });
                setSelectedRowKeys([]);
              }}
            >
              批量启用/禁用
            </KTable.Button>
          </Space>
        </Flex>
      }
    />
  );
};

export default PositionTable;
