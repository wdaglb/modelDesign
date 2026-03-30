import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd';

import { useKModal } from '@/components/KModal';
import { Route as ProjectDetailRoute } from './$projectId';
import TableDesignForm from './components/#TableDesignForm';

export const Route = createFileRoute('/project/$projectId/tables')({
  component: RouteComponent,
});

function RouteComponent() {
  const modal = useKModal();
  const project = ProjectDetailRoute.useLoaderData();

  const tableDrafts = useMemo(() => {
    const prefix = project?.code || 'table';
    return [
      {
        name: `${prefix}_user`,
        text: '用户表',
        description: '承载账号、昵称、手机号等用户基础字段。',
        columns: ['id', 'username', 'nickname', 'mobile', 'status'],
        status: '建议创建',
      },
      {
        name: `${prefix}_log`,
        text: '操作日志表',
        description: '记录关键业务操作，便于后续审计与追踪。',
        columns: ['id', 'operatorId', 'action', 'ip', 'createdAt'],
        status: '可选',
      },
    ];
  }, [project?.code]);

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space
          align="start"
          style={{ width: '100%', justifyContent: 'space-between' }}
          wrap
        >
          <Space orientation="vertical" size={4}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              数据表管理
            </Typography.Title>
            <Typography.Text type="secondary">
              为项目 {project?.name} 设计核心表结构，创建后可继续扩展字段与生成代码。
            </Typography.Text>
          </Space>

          <Button
            type="primary"
            onClick={async () => {
              await modal.open({
                title: '新建设计表',
                width: 960,
                children: <TableDesignForm />,
              });
            }}
          >
            新建设计表
          </Button>
        </Space>
      </Card>

      {tableDrafts.length ? (
        <Row gutter={[16, 16]}>
          {tableDrafts.map((item) => (
            <Col key={item.name} xs={24} md={12}>
              <Card>
                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                  <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Space orientation="vertical" size={0}>
                      <Typography.Title level={5} style={{ margin: 0 }}>
                        {item.text}
                      </Typography.Title>
                      <Typography.Text type="secondary">{item.name}</Typography.Text>
                    </Space>
                    <Tag color={item.status === '建议创建' ? 'blue' : 'default'}>
                      {item.status}
                    </Tag>
                  </Space>

                  <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    {item.description}
                  </Typography.Paragraph>

                  <Space wrap>
                    {item.columns.map((column) => (
                      <Tag key={column}>{column}</Tag>
                    ))}
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="暂无数据表" />
      )}
    </Space>
  );
}
