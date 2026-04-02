import React, { Key, useMemo, useState } from 'react';
import { Avatar, Empty, Flex, Input, InputNumber, Space, Tag, Typography, message } from 'antd';
import type { TableColumnsType } from 'antd';

import { ApiUser } from '@/api';
import type { User } from '@/api/modules/user';
import { KTable } from '@/components';
import { useKModal } from '@/components/KModal';
import queryKey from '@/constants/queryKey';
import useFileUrl from '@/hooks/useFileUrl';
import Icons from '@/icons';

import BatchUpdateForm from './#BatchUpdateForm';
import CreateUserForm from './#CreateUserForm';
import PositionDrawer from './#PositionDrawer';
import RoleDrawer from './#RoleDrawer';
import { getUserTenantText } from './#tenantHelper';
import UpdateUserForm from './#UpdateUserForm';

/**
 * 用户信息单元格。
 *
 * 统一封装头像、昵称、用户名的展示样式，避免列定义里直接堆叠过多 JSX。
 */
const UserInfoCell = ({ item }: { item: User }) => {
  const avatarUrl = useFileUrl(item.avatarId);
  let avatarText = '用';
  if (item.nickname) {
    avatarText = item.nickname.slice(0, 1);
  }

  let displayName = '未命名用户';
  if (item.nickname) {
    displayName = item.nickname;
  }

  return (
    <Space align="center" size={12}>
      <Avatar src={avatarUrl}>{avatarText}</Avatar>
      <Space orientation="vertical" size={0}>
        <Typography.Text strong>{displayName}</Typography.Text>
        <Typography.Text type="secondary">{item.username}</Typography.Text>
      </Space>
    </Space>
  );
};

/**
 * 用户管理表格。
 *
 * 说明：
 * - 使用项目封装的 `KTable` 作为列表承载组件
 * - 工具栏按钮统一使用 `KTable.Button`
 * - 行内状态操作使用 `KTable.ConfirmButton`
 * - 当前删除语义已收敛为“禁用/启用”，因此页面不提供物理删除入口
 */
const UserTable = () => {
  const modal = useKModal();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [nickname, setNickname] = useState('');
  const [tenantId, setTenantId] = useState<number>();

  /**
   * 列表查询参数。
   *
   * 保持与 `/user/list` 接口字段一致；当昵称为空时不传该筛选条件。
   */
  const params = useMemo(
    () => ({
      ...pagination,
      nickname: nickname.trim() || undefined,
      tenantId,
    }),
    [nickname, pagination, tenantId],
  );

  const columns: TableColumnsType<User> = [
    {
      title: '用户信息',
      dataIndex: 'nickname',
      key: 'nickname',
      render: (_, item) => <UserInfoCell item={item} />,
    },
    {
      title: '用户 ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '租户',
      dataIndex: 'tenantName',
      key: 'tenantName',
      width: 220,
      render: (_, record) => {
        return getUserTenantText(record);
      },
    },
    {
      title: '状态',
      dataIndex: 'isDisable',
      key: 'isDisable',
      width: 120,
      render: (value: User['isDisable']) => {
        if (value) {
          return <Tag color={'red'}>禁用</Tag>;
        }
        return <Tag color={'green'}>启用</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 420,
      render: (_, record) => {
        let bindRoleTitle = record.username;
        if (record.nickname) {
          bindRoleTitle = record.nickname;
        }

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
                  title: '修改用户',
                  width: 520,
                  children: <UpdateUserForm record={record} />,
                });
              }}
            >
              编辑
            </KTable.Button>

            <KTable.Button
              variant={'filled'}
              color={'cyan'}
              size={'small'}
              icon={<Icons.AccountKey />}
              onClick={async () => {
                await modal.open({
                  title: `绑定角色 - ${bindRoleTitle}`,
                  width: 560,
                  children: <RoleDrawer user={record} />,
                });
              }}
            >
              绑定角色
            </KTable.Button>

            <KTable.Button
              variant={'filled'}
              color={'geekblue'}
              size={'small'}
              icon={<Icons.BadgeAccountHorizontal />}
              onClick={async () => {
                if (
                  record.tenantId === undefined ||
                  record.tenantId === null
                ) {
                  message.warning('用户未绑定租户，不能绑定职位');
                  return;
                }

                await modal.open({
                  title: `绑定职位 - ${bindRoleTitle}`,
                  width: 680,
                  children: <PositionDrawer user={record} />,
                });
              }}
            >
              绑定职位
            </KTable.Button>

            <KTable.ConfirmButton
              variant={'filled'}
              color={confirmColor}
              size={'small'}
              onConfirm={async () => {
                await ApiUser.updateStatus({
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
    <KTable<User>
      queryKey={[...queryKey.user.list(), params]}
      request={ApiUser.getPageList}
      params={params}
      columns={columns}
      rowSelection={{
        selectedRowKeys,
        onChange: setSelectedRowKeys,
      }}
      locale={{
        emptyText: (
          <Empty description={nickname ? '未找到匹配的用户' : '暂无用户数据'} />
        ),
      }}
      toolbar={
        <Flex justify={'space-between'} gap={12} wrap style={{ width: '100%' }}>
          <Space>
            <Input.Search
              allowClear
              placeholder={'请输入昵称搜索'}
              style={{ width: 240 }}
              onSearch={(value) => {
                setPagination((prev) => ({ ...prev, current: 1 }));
                setNickname(value);
              }}
            />

            <InputNumber
              min={1}
              precision={0}
              style={{ width: 180 }}
              placeholder={'按租户 ID 筛选'}
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
                  title: '添加用户',
                  width: 520,
                  children: <CreateUserForm />,
                });
              }}
            >
              添加用户
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

export default UserTable;
