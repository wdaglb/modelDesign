import { createFileRoute } from '@tanstack/react-router';
import { Alert, Card, Col, Descriptions, Row, Space, Tag } from 'antd';

import { DatabaseTypeLabel } from '@/api/modules/project.types';
import { Route as ProjectDetailRoute } from './$projectId';

export const Route = createFileRoute('/project/$projectId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const project = ProjectDetailRoute.useLoaderData();

  // 项目数据库类型标签颜色映射。
  const databaseTypeColors: Record<string, string> = {
    mysql: 'blue',
    postgresql: 'green',
    mongodb: 'orange',
    sqlite: 'purple',
  };

  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} xl={15}>
        <Card title="项目信息" styles={{ body: { padding: 20 } }}>
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="项目名称">{project?.name}</Descriptions.Item>
            <Descriptions.Item label="项目编号">{project?.code}</Descriptions.Item>
            <Descriptions.Item label="数据库类型">
              <Tag color={databaseTypeColors[project?.dbType || 'mysql']}>
                {project ? DatabaseTypeLabel[project.dbType] : '-'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="项目 ID">{project?.id}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {project?.createdAt || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {project?.updatedAt || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="项目描述">
              {project?.description || '暂无描述'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>

      <Col xs={24} xl={9}>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Card title="管理入口" styles={{ body: { padding: 20 } }}>
            <Alert
              type="info"
              showIcon
              title="项目基础信息"
              description="这里展示当前项目的核心信息。你可以从上方切换到数据表和成员模块，继续完成项目管理工作。"
            />
          </Card>

          <Card title="当前状态" styles={{ body: { padding: 20 } }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="当前项目">{project?.name}</Descriptions.Item>
              <Descriptions.Item label="描述状态">
                {project?.description ? '已填写' : '未填写'}
              </Descriptions.Item>
              <Descriptions.Item label="数据源类型">
                {project ? DatabaseTypeLabel[project.dbType] : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Space>
      </Col>
    </Row>
  );
}
