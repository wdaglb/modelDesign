import { useContext, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Flex, Input, Spin, Tag, Typography, message } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiPosition, ApiUser } from '@/api';
import type { Position } from '@/api/modules/position';
import type { User } from '@/api/modules/user';
import { modalContext } from '@/components/KModal/Modal.tsx';
import queryKey from '@/constants/queryKey';

interface Props {
  user: User;
}

/**
 * 职位列表卡片。
 */
const PositionListCard = ({
  title,
  positions,
  emptyText,
  actionText,
  onAction,
}: {
  title: string;
  positions: Position[];
  emptyText: string;
  actionText: string;
  onAction: (positionId: number) => void;
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
        <Tag bordered={false}>{positions.length}</Tag>
      </Flex>

      <div
        style={{
          minHeight: 280,
          maxHeight: 380,
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {positions.length > 0 ? (
          positions.map((position) => (
            <Flex
              key={position.id}
              align={'center'}
              justify={'space-between'}
              gap={12}
              style={{
                padding: '8px 12px',
              }}
            >
              <Flex vertical gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text>{position.name}</Typography.Text>
                <Typography.Text type={'secondary'} ellipsis>
                  {position.code}
                </Typography.Text>
                {position.remark ? (
                  <Typography.Text type={'secondary'} ellipsis>
                    {position.remark}
                  </Typography.Text>
                ) : null}
              </Flex>
              <Flex align={'center'} gap={8}>
                {position.isDisable ? <Tag color={'red'}>禁用</Tag> : null}
                <Button size={'small'} onClick={() => onAction(position.id)}>
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
 * 用户绑定职位面板。
 */
const PositionDrawer = ({ user }: Props) => {
  const ctx = useContext(modalContext);
  const queryClient = useQueryClient();
  const [checkedPositionIds, setCheckedPositionIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const hasTenant = user.tenantId !== undefined && user.tenantId !== null;

  const { data: positionData, isLoading: positionLoading } = useQuery({
    queryKey: [
      ...queryKey.position.list(),
      { pageSize: 1000, tenantId: user.tenantId },
    ],
    queryFn: () => {
      if (!hasTenant || user.tenantId === undefined) {
        return Promise.resolve({ items: [], total: 0 });
      }
      return ApiPosition.getPageList({
        pageSize: 1000,
        tenantId: user.tenantId,
      });
    },
    enabled: hasTenant,
  });

  const { data: boundPositionIds = [], isLoading: boundLoading } = useQuery({
    queryKey: queryKey.user.positions(user.id),
    queryFn: () => ApiUser.getUserPositions(user.id),
    staleTime: 0,
    enabled: hasTenant,
  });

  useEffect(() => {
    setCheckedPositionIds(boundPositionIds);
  }, [boundPositionIds]);

  const positions = positionData?.items ?? [];

  const filteredPositions = useMemo(() => {
    const keyword = searchValue.trim();
    if (!keyword) {
      return positions;
    }
    return positions.filter((item) => {
      if (item.name.includes(keyword)) {
        return true;
      }
      return item.code.includes(keyword);
    });
  }, [positions, searchValue]);

  const pendingPositions = useMemo(() => {
    return filteredPositions.filter((item) => {
      if (checkedPositionIds.includes(item.id)) {
        return false;
      }
      if (item.isDisable) {
        return false;
      }
      return true;
    });
  }, [filteredPositions, checkedPositionIds]);

  const selectedPositions = useMemo(() => {
    return filteredPositions.filter((item) => checkedPositionIds.includes(item.id));
  }, [filteredPositions, checkedPositionIds]);

  const isLoading = positionLoading || boundLoading;

  /**
   * 添加职位绑定。
   */
  const handleAddPosition = (positionId: number) => {
    setCheckedPositionIds((prev) => {
      if (prev.includes(positionId)) {
        return prev;
      }
      return [...prev, positionId];
    });
  };

  /**
   * 移除职位绑定。
   */
  const handleRemovePosition = (positionId: number) => {
    setCheckedPositionIds((prev) => prev.filter((item) => item !== positionId));
  };

  /**
   * 保存绑定关系。
   */
  const handleSave = async () => {
    setSubmitting(true);
    try {
      await ApiUser.updateUserPositions(user.id, checkedPositionIds);
      await queryClient.invalidateQueries({
        queryKey: queryKey.user.positions(user.id),
      });
      message.success('职位绑定成功');
      ctx.resolve();
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasTenant) {
    return (
      <Flex vertical gap={16}>
        <Typography.Text type={'secondary'}>
          当前用户未绑定租户，不能绑定职位。
        </Typography.Text>

        <Flex gap={8} justify={'flex-end'}>
          <Button type={'primary'} onClick={() => ctx.close()}>
            知道了
          </Button>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex vertical gap={16}>
      <Input
        placeholder={'搜索职位名称或编码'}
        allowClear
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />

      <Spin spinning={isLoading}>
        <Flex gap={16} align={'stretch'}>
          <PositionListCard
            title={'待添加职位'}
            positions={pendingPositions}
            emptyText={'暂无待添加职位'}
            actionText={'添加'}
            onAction={handleAddPosition}
          />
          <PositionListCard
            title={'已绑定职位'}
            positions={selectedPositions}
            emptyText={'暂无已绑定职位'}
            actionText={'移除'}
            onAction={handleRemovePosition}
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

export default PositionDrawer;
