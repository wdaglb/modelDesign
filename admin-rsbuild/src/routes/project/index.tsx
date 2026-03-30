import React, { useState } from 'react';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Popconfirm,
  message,
  Pagination,
  Button,
  Skeleton,
  Input,
  Empty,
} from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiProject } from '@/api';
import { useKModal } from '@/components/KModal';
import ProjectForm from './components/#ProjectForm';
import { Project, DatabaseTypeLabel } from '@/api/modules/project.types';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';

export const Route = createFileRoute('/project/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const modal = useKModal();

  const [pagination, setPagination] = useState({ current: 1, pageSize: 12 });
  const [searchName, setSearchName] = useState('');

  const databaseTypeColors: Record<string, string> = {
    mysql: 'blue',
    postgresql: 'green',
    mongodb: 'orange',
    sqlite: 'purple',
  };

  const { data, isLoading } = useQuery({
    queryKey: [...queryKey.project.list(), pagination, searchName],
    queryFn: () => ApiProject.getList({ ...pagination, name: searchName }),
  });

  const handleDelete = async (ids: number[]) => {
    await ApiProject.deleted(ids);
    queryClient.invalidateQueries({ queryKey: queryKey.project.list() });
    message.success('删除成功');
  };

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Input.Search
            placeholder="请输入项目名称"
            style={{ width: 240 }}
            allowClear
            onSearch={setSearchName}
          />
          <Button
            type="primary"
            icon={<Icons.Plus />}
            onClick={async () => {
              await modal.open({
                title: '添加项目',
                children: <ProjectForm />,
              });
              queryClient.invalidateQueries({
                queryKey: queryKey.project.list(),
              });
            }}
          >
            添加项目
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Col xs={24} sm={12} md={8} lg={6} key={i}>
              <Card>
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))
        ) : data?.items?.length ? (
          data.items.map((project: Project) => (
            <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
              <Card
                hoverable
                onClick={() => {
                  navigate({
                    to: '/project/$projectId',
                    params: { projectId: String(project.id) },
                  });
                }}
                styles={{ body: { cursor: 'pointer' } }}
                extra={
                  <Tag color={databaseTypeColors[project.dbType]}>
                    {DatabaseTypeLabel[project.dbType]}
                  </Tag>
                }
              >
                <Space orientation="vertical" style={{ width: '100%' }}>
                  <Typography.Title
                    level={5}
                    ellipsis={{ tooltip: project.name }}
                    style={{ marginBottom: 8, marginTop: 0 }}
                  >
                    {project.name}
                  </Typography.Title>

                  <Typography.Text type="secondary">
                    {project.code}
                  </Typography.Text>

                  {project.description && (
                    <Typography.Text
                      type="secondary"
                      ellipsis={{ tooltip: project.description }}
                    >
                      {project.description}
                    </Typography.Text>
                  )}

                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {project.createdAt}
                  </Typography.Text>

                  <Space>
                    <Button
                      size="small"
                      onClick={async (event) => {
                        event.stopPropagation();
                        await modal.open({
                          title: '编辑项目',
                          children: <ProjectForm record={project} />,
                        });
                        queryClient.invalidateQueries({
                          queryKey: queryKey.project.list(),
                        });
                      }}
                    >
                      编辑
                    </Button>

                    <Popconfirm
                      title="确认删除"
                      description="删除后无法恢复，确认删除此项目吗？"
                      onPopupClick={(event) => {
                        event.stopPropagation();
                      }}
                      onConfirm={async () => {
                        await handleDelete([project.id]);
                      }}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button
                        size="small"
                        danger
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <Card>
              <Empty
                description={searchName ? '未找到匹配的项目' : '暂无项目数据'}
              />
            </Card>
          </Col>
        )}
      </Row>

      {Boolean(data?.total) && (
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={data?.total}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `共 ${total} 条`}
            onChange={(current, pageSize) =>
              setPagination({ current, pageSize })
            }
          />
        </div>
      )}
    </Card>
  );
}
