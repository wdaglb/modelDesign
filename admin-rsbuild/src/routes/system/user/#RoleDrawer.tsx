import { useContext, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Flex, Input, message, Spin, Tag, Typography } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiRole, ApiUser } from '@/api';
import type { User } from '@/api/modules/user';
import { modalContext } from '@/components/KModal/Modal.tsx';
import queryKey from '@/constants/queryKey';

interface Props {
  user: User;
}

interface RoleItem {
  id: number;
  name: string;
  code: string;
  isDisable?: boolean;
}

/**
 * 角色列表卡片。
 */
const RoleListCard = ({
  title,
  roles,
  emptyText,
  onAction,
  actionText,
}: {
  title: string;
  roles: RoleItem[];
  emptyText: string;
  onAction: (code: string) => void;
  actionText: string;
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
        <Tag bordered={false}>{roles.length}</Tag>
      </Flex>

      <div
        style={{
          minHeight: 280,
          maxHeight: 380,
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {roles.length > 0 ? (
          roles.map((role) => (
            <Flex
              key={role.code}
              align={'center'}
              justify={'space-between'}
              gap={12}
              style={{
                padding: '8px 12px',
              }}
            >
              <Flex vertical gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text>{role.name}</Typography.Text>
                <Typography.Text type={'secondary'} ellipsis>
                  {role.code}
                </Typography.Text>
              </Flex>
              <Flex align={'center'} gap={8}>
                {role.isDisable ? <Tag color={'red'}>禁用</Tag> : null}
                <Button size={'small'} onClick={() => onAction(role.code)}>
                  {actionText}
                </Button>
              </Flex>
            </Flex>
          ))
        ) : (
          <Empty description={emptyText} style={{ marginTop: 48 }} />
        )}
      </div>
    </div>
  );
};

/**
 * 用户绑定角色面板。
 *
 * 左侧展示待添加角色，右侧展示已绑定角色。
 */
const RoleDrawer = ({ user }: Props) => {
  const ctx = useContext(modalContext);
  const queryClient = useQueryClient();

  const { data: roleData, isLoading: roleLoading } = useQuery({
    queryKey: ['userBindRoleList'],
    queryFn: () => ApiRole.getPageList({ pageSize: 1000 }),
  });

  const { data: boundRoleCodes = [], isLoading: boundLoading } = useQuery({
    queryKey: queryKey.user.roles(user.id),
    queryFn: () => ApiUser.getUserRoles(user.id),
    staleTime: 0,
  });

  const [checkedCodes, setCheckedCodes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setCheckedCodes(boundRoleCodes);
  }, [boundRoleCodes]);

  const roles = roleData?.items ?? [];

  const filteredRoles = useMemo(() => {
    const keyword = searchValue.trim();
    if (!keyword) {
      return roles;
    }
    return roles.filter(
      (item) => item.name.includes(keyword) || item.code.includes(keyword),
    );
  }, [roles, searchValue]);

  const pendingRoles = useMemo(() => {
    return filteredRoles.filter((item) => !checkedCodes.includes(item.code));
  }, [filteredRoles, checkedCodes]);

  const selectedRoles = useMemo(() => {
    return filteredRoles.filter((item) => checkedCodes.includes(item.code));
  }, [filteredRoles, checkedCodes]);

  const isLoading = roleLoading || boundLoading;

  /** 添加角色绑定。 */
  const handleAddRole = (code: string) => {
    setCheckedCodes((prev) => {
      if (prev.includes(code)) {
        return prev;
      }
      return [...prev, code];
    });
  };

  /** 移除角色绑定。 */
  const handleRemoveRole = (code: string) => {
    setCheckedCodes((prev) => prev.filter((item) => item !== code));
  };

  /** 保存绑定关系。 */
  const handleSave = async () => {
    setSubmitting(true);
    try {
      await ApiUser.updateUserRoles(user.id, checkedCodes);
      await queryClient.invalidateQueries({
        queryKey: queryKey.user.roles(user.id),
      });
      message.success('角色绑定成功');
      ctx.resolve();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex vertical gap={16}>
      <Input
        placeholder={'搜索角色名称或编码'}
        allowClear
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />

      <Spin spinning={isLoading}>
        <Flex gap={16} align={'stretch'}>
          <RoleListCard
            title={'待添加角色'}
            roles={pendingRoles}
            emptyText={'暂无待添加角色'}
            actionText={'添加'}
            onAction={handleAddRole}
          />
          <RoleListCard
            title={'已绑定角色'}
            roles={selectedRoles}
            emptyText={'暂无已绑定角色'}
            actionText={'移除'}
            onAction={handleRemoveRole}
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

export default RoleDrawer;
