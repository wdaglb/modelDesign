import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Button,
  Card,
  Empty,
  Popconfirm,
  Space,
  Table,
  Typography,
} from 'antd';
import type { TableProps } from 'antd';

import { ApiProjectMember } from '@/api';
import { UserPickerModal } from '@/components';
import { useKModal } from '@/components/KModal';
import { PERMISSION_RESOURCE } from '@/constants/permission.ts';
import usePermission from '@/hooks/usePermission.ts';
import useFileUrl from '@/hooks/useFileUrl';
import { Route as ProjectDetailRoute } from './$projectId';
import Icons from '@/icons';

export const Route = createFileRoute('/project/$projectId/members')({
  component: RouteComponent,
});

type ProjectMemberItem = Awaited<
  ReturnType<typeof ApiProjectMember.getList>
>[number];

function RouteComponent() {
  const { projectId } = Route.useParams();
  const modal = useKModal();
  const queryClient = useQueryClient();
  const { hasButtonPermission } = usePermission();
  ProjectDetailRoute.useLoaderData();
  const numericProjectId = Number(projectId);
  const isValidProjectId =
    Number.isInteger(numericProjectId) && numericProjectId > 0;
  const canManageMembers = hasButtonPermission(
    PERMISSION_RESOURCE.projectMemberManage,
  );

  const { data: memberData, isLoading } = useQuery({
    queryKey: ['projectMemberList', numericProjectId],
    queryFn: () => ApiProjectMember.getList(numericProjectId),
    enabled: isValidProjectId,
  });

  const handleDelete = async (userId: number) => {
    await ApiProjectMember.deleted({
      projectId: numericProjectId,
      userIds: [userId],
    });
    await queryClient.invalidateQueries({
      queryKey: ['projectMemberList', numericProjectId],
    });
  };

  const existUserIds =
    memberData?.map((item: ProjectMemberItem) => item.userId) || [];

  const columns: TableProps<ProjectMemberItem>['columns'] = [
    {
      title: '成员',
      dataIndex: 'nickname',
      key: 'nickname',
      render: (_: ProjectMemberItem['nickname'], item: ProjectMemberItem) => (
        <MemberCell item={item} />
      ),
    },
    {
      title: '用户 ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 140,
    },
    {
      title: '加入时间',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 220,
      render: (value: ProjectMemberItem['joinedAt']) => value || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'right',
      render: (_: unknown, item: ProjectMemberItem) => (
        canManageMembers ? (
          <Popconfirm
            title="确认移除"
            description="确认将该成员移出当前项目吗？"
            okText="确认"
            cancelText="取消"
            onConfirm={async () => {
              await handleDelete(item.userId);
            }}
          >
            <Button danger size="small">
              移除
            </Button>
          </Popconfirm>
        ) : null
      ),
    },
  ];

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card
        title="成员列表"
        loading={isLoading}
        extra={
          canManageMembers ? (
            <Button
              type="primary"
              icon={<Icons.Plus />}
              disabled={!isValidProjectId}
              onClick={async () => {
                await modal.open({
                  title: '添加项目成员',
                  width: 720,
                  children: (
                    <UserPickerModal
                      defaultMode="search"
                      excludeUserIds={existUserIds}
                      onSubmit={async (userIds: number[]) => {
                        await ApiProjectMember.add({
                          projectId: numericProjectId,
                          userIds,
                        });
                      }}
                    />
                  ),
                });

                await queryClient.invalidateQueries({
                  queryKey: ['projectMemberList', numericProjectId],
                });
              }}
            >
              添加成员
            </Button>
          ) : null
        }
      >
        {memberData?.length ? (
          <Table<ProjectMemberItem>
            rowKey="userId"
            dataSource={memberData}
            columns={columns}
            pagination={false}
            locale={{ emptyText: <Empty description="当前项目暂无成员" /> }}
          />
        ) : (
          <Empty description="当前项目暂无成员" />
        )}
      </Card>
    </Space>
  );
}

interface MemberCellProps {
  item: ProjectMemberItem;
}

const MemberCell = ({ item }: MemberCellProps) => {
  const avatarUrl = useFileUrl(item.avatarId);

  return (
    <Space align="center" size={12}>
      <Avatar src={avatarUrl}>{item.nickname?.slice(0, 1) || '成'}</Avatar>
      <Space orientation="vertical" size={0}>
        <Typography.Text strong>
          {item.nickname || '未命名成员'}
        </Typography.Text>
        <Typography.Text type="secondary">项目成员</Typography.Text>
      </Space>
    </Space>
  );
};
