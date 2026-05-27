import React, { Key, useMemo, useState } from 'react';
import { Empty, Flex, Input, Space, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

import { ApiRole } from '@/api';
import type { Role } from '@/api/modules/role';
import { KTable } from '@/components';
import { useKModal } from '@/components/KModal';
import { PERMISSION_RESOURCE } from '@/constants/permission.ts';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';

import BatchUpdateForm from './#BatchUpdateForm';
import CreateRoleForm from './#CreateRoleForm';
import PermissionDrawer from './#PermissionDrawer';
import UserDrawer from './#UserDrawer';
import UpdateRoleForm from './#UpdateRoleForm';

/**
 * 角色基础信息单元格。
 *
 * 统一封装角色名称、编码与备注的展示样式，避免列定义里堆叠过多 JSX。
 */
const RoleInfoCell = ({ item }: { item: Role }) => {
  return (
    <Space orientation={'vertical'} size={0}>
      <Typography.Text strong>{item.name}</Typography.Text>
      <Typography.Text type={'secondary'}>{item.code}</Typography.Text>
      {item.remark && (
        <Typography.Text type={'secondary'}>{item.remark}</Typography.Text>
      )}
    </Space>
  );
};

/**
 * 角色管理表格。
 *
 * 说明：
 * - 使用项目封装的 `KTable` 作为列表承载组件
 * - 工具栏按钮统一使用 `KTable.Button`
 * - 行内状态操作使用 `KTable.ConfirmButton`
 * - 当前删除语义已收敛为“禁用/启用”，因此页面不提供物理删除入口
 */
const RoleTable = () => {
  const modal = useKModal();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [keyword, setKeyword] = useState('');

  /**
   * 列表查询参数。
   *
   * 当前关键字会同时匹配角色名称与角色编码；当关键字为空时不传该筛选条件。
   */
  const params = useMemo(
    () => ({
      ...pagination,
      name: keyword.trim() || undefined,
      code: keyword.trim() || undefined,
    }),
    [keyword, pagination],
  );

  const columns: TableColumnsType<Role> = [
    {
      title: '角色信息',
      dataIndex: 'name',
      key: 'name',
      render: (_, item) => <RoleInfoCell item={item} />,
    },
    {
      title: '角色 ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
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
      render: (value: Role['isDisable']) => {
        if (value) {
          return <Tag color={'red'}>禁用</Tag>;
        }
        return <Tag color={'green'}>启用</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
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
              permissionCode={PERMISSION_RESOURCE.systemRoleEdit}
              onClick={async () => {
                await modal.open({
                  title: '修改角色',
                  width: 520,
                  children: <UpdateRoleForm record={record} />,
                });
              }}
            >
              编辑
            </KTable.Button>

            <KTable.Button
              variant={'filled'}
              color={'purple'}
              size={'small'}
              icon={<Icons.ShieldEdit />}
              permissionCode={PERMISSION_RESOURCE.systemRolePermission}
              onClick={async () => {
                await modal.open({
                  title: `权限配置 - ${record.name}`,
                  width: 760,
                  children: <PermissionDrawer role={record} />,
                });
              }}
            >
              权限配置
            </KTable.Button>

            <KTable.Button
              variant={'filled'}
              color={'geekblue'}
              size={'small'}
              icon={<Icons.AccountGroup />}
              permissionCode={PERMISSION_RESOURCE.systemRoleBindUser}
              onClick={async () => {
                await modal.open({
                  title: `绑定用户 - ${record.name}`,
                  width: 620,
                  children: <UserDrawer role={record} />,
                });
              }}
            >
              绑定用户
            </KTable.Button>

            <KTable.ConfirmButton
              variant={'filled'}
              color={confirmColor}
              size={'small'}
              permissionCode={PERMISSION_RESOURCE.systemRoleChangeStatus}
              onConfirm={async () => {
                await ApiRole.updateStatus({
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
    <KTable<Role>
      queryKey={[...queryKey.role.list(), params]}
      request={ApiRole.getPageList}
      params={params}
      columns={columns}
      rowSelection={{
        selectedRowKeys,
        onChange: setSelectedRowKeys,
      }}
      locale={{
        emptyText: (
          <Empty description={keyword ? '未找到匹配的角色' : '暂无角色数据'} />
        ),
      }}
      toolbar={
        <Flex justify={'space-between'} gap={12} wrap style={{ width: '100%' }}>
          <Space>
            <Input.Search
              allowClear
              placeholder={'请输入角色名称或编码搜索'}
              style={{ width: 260 }}
              onSearch={(value) => {
                setPagination((prev) => ({ ...prev, current: 1 }));
                setKeyword(value);
              }}
            />
          </Space>

          <Space>
            <KTable.Button
              type={'primary'}
              icon={<Icons.Plus />}
              permissionCode={PERMISSION_RESOURCE.systemRoleCreate}
              onClick={async () => {
                await modal.open({
                  title: '添加角色',
                  width: 520,
                  children: <CreateRoleForm />,
                });
              }}
            >
              添加角色
            </KTable.Button>

            <KTable.Button
              permissionCode={PERMISSION_RESOURCE.systemRoleBatchChangeStatus}
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

export default RoleTable;
