import { useContext, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Empty, Flex, Input, message, Spin, Tag, Typography } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiRole, ApiUser } from '@/api';
import type { Role } from '@/api/modules/role';
import type { User } from '@/api/modules/user';
import { modalContext } from '@/components/KModal/Modal.tsx';
import queryKey from '@/constants/queryKey';
import useFileUrl from '@/hooks/useFileUrl';

interface Props {
  role: Role;
}

/**
 * 用户列表项。
 */
const UserListItem = ({
  user,
  actionText,
  onAction,
}: {
  user: User;
  actionText: string;
  onAction: (userId: number) => void;
}) => {
  const avatarUrl = useFileUrl(user.avatarId);
  let avatarText = '用';
  if (user.nickname) {
    avatarText = user.nickname.slice(0, 1);
  }

  let displayName = '未命名用户';
  if (user.nickname) {
    displayName = user.nickname;
  }

  return (
    <Flex
      align={'center'}
      justify={'space-between'}
      gap={12}
      style={{
        padding: '8px 12px',
      }}
    >
      <Flex align={'center'} gap={12} style={{ flex: 1, minWidth: 0 }}>
        <Avatar src={avatarUrl}>{avatarText}</Avatar>
        <Flex vertical gap={0} style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text>{displayName}</Typography.Text>
          <Typography.Text type={'secondary'} ellipsis>
            {user.username}
          </Typography.Text>
        </Flex>
      </Flex>
      <Flex align={'center'} gap={8}>
        {user.isDisable ? <Tag color={'red'}>禁用</Tag> : null}
        <Button size={'small'} onClick={() => onAction(user.id)}>
          {actionText}
        </Button>
      </Flex>
    </Flex>
  );
};

/**
 * 用户列表卡片。
 */
const UserListCard = ({
  title,
  users,
  emptyText,
  actionText,
  onAction,
}: {
  title: string;
  users: User[];
  emptyText: string;
  actionText: string;
  onAction: (userId: number) => void;
}) => {
  const borderColor = 'rgba(0,0,0,0.15)';

  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <Flex
        align={'center'}
        justify={'space-between'}
        style={{
          padding: '10px 12px',
          borderBottom: `1px solid ${borderColor}`,
          background: 'rgba(0,0,0,0.02)',
        }}
      >
        <Typography.Text strong>{title}</Typography.Text>
        <Tag variant="filled">{users.length}</Tag>
      </Flex>

      <div
        style={{
          minHeight: 280,
          maxHeight: 380,
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {users.length > 0 ? (
          users.map((user) => (
            <UserListItem
              key={user.id}
              user={user}
              actionText={actionText}
              onAction={onAction}
            />
          ))
        ) : (
          <Empty description={emptyText} style={{ marginTop: 48 }} />
        )}
      </div>
    </div>
  );
};

/**
 * 角色绑定用户面板。
 *
 * 左侧展示待添加用户，右侧展示已绑定用户。
 */
const UserDrawer = ({ role }: Props) => {
  const ctx = useContext(modalContext);
  const queryClient = useQueryClient();

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['roleBindUserList'],
    queryFn: () => ApiUser.getPageList({ pageSize: 1000 }),
  });

  const { data: boundUserIds = [], isLoading: boundLoading } = useQuery({
    queryKey: queryKey.role.users(role.code),
    queryFn: () => ApiRole.getRoleUsers(role.code),
    staleTime: 0,
  });

  const [checkedUserIds, setCheckedUserIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setCheckedUserIds(boundUserIds);
  }, [boundUserIds]);

  const users = userData?.items ?? [];

  const filteredUsers = useMemo(() => {
    const keyword = searchValue.trim();
    if (!keyword) {
      return users;
    }
    return users.filter(
      (item) =>
        item.nickname?.includes(keyword) || item.username?.includes(keyword),
    );
  }, [searchValue, users]);

  const pendingUsers = useMemo(() => {
    return filteredUsers.filter((item) => !checkedUserIds.includes(item.id));
  }, [filteredUsers, checkedUserIds]);

  const selectedUsers = useMemo(() => {
    return filteredUsers.filter((item) => checkedUserIds.includes(item.id));
  }, [filteredUsers, checkedUserIds]);

  const isLoading = userLoading || boundLoading;

  /** 添加用户绑定。 */
  const handleAddUser = (userId: number) => {
    setCheckedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev;
      }
      return [...prev, userId];
    });
  };

  /** 移除用户绑定。 */
  const handleRemoveUser = (userId: number) => {
    setCheckedUserIds((prev) => prev.filter((item) => item !== userId));
  };

  /** 保存绑定关系。 */
  const handleSave = async () => {
    setSubmitting(true);
    try {
      await ApiRole.updateRoleUsers(role.code, checkedUserIds);
      await queryClient.invalidateQueries({
        queryKey: queryKey.role.users(role.code),
      });
      message.success('用户绑定成功');
      ctx.resolve();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex vertical gap={16}>
      <Input
        placeholder={'搜索昵称或用户名'}
        allowClear
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />

      <Spin spinning={isLoading}>
        <Flex gap={16} align={'stretch'}>
          <UserListCard
            title={'待添加用户'}
            users={pendingUsers}
            emptyText={'暂无待添加用户'}
            actionText={'添加'}
            onAction={handleAddUser}
          />
          <UserListCard
            title={'已绑定用户'}
            users={selectedUsers}
            emptyText={'暂无已绑定用户'}
            actionText={'移除'}
            onAction={handleRemoveUser}
          />
        </Flex>
      </Spin>

      <Flex gap={8} justify={'flex-end'}>
        <Button onClick={() => ctx.close()}>取消</Button>
        <Button type={'primary'} loading={submitting} onClick={handleSave}>
          保存
        </Button>
      </Flex>
    </Flex>
  );
};

export default UserDrawer;
