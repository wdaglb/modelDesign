import { Button, Card, Flex, Select, Space, Tag, Typography } from 'antd';

import type { TaskStatusCode } from '@/api/modules/project-task.types';

interface TaskPreviewSummaryProps {
  canApplyStatus: boolean;
  onApplyStatus: () => Promise<void>;
  onClose: () => void;
  onEdit: () => Promise<void>;
  onStatusChange: (value: TaskStatusCode) => void;
  priorityColor: string;
  priorityText: string;
  projectText: string;
  selectedStatus?: TaskStatusCode;
  statusOptions: Array<{ label: string; value: string }>;
  statusTagColor: string;
  statusText: string;
  title: string;
  updatingStatus: boolean;
}

/**
 * 任务预览摘要头。
 */
const TaskPreviewSummary = (props: TaskPreviewSummaryProps) => {
  return (
    <Card
      size="small"
      style={{
        borderRadius: 16,
      }}
      styles={{
        body: {
          padding: 18,
        },
      }}
    >
      <Space
        direction="vertical"
        size={16}
        style={{ width: '100%' }}
        styles={{ item: { width: '100%' } }}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Typography.Text
            type="secondary"
            style={{
              fontSize: 12,
              letterSpacing: 0.3,
            }}
          >
            {props.projectText}
          </Typography.Text>
          <Typography.Title
            level={4}
            style={{
              margin: 0,
              lineHeight: '30px',
            }}
          >
            {props.title}
          </Typography.Title>
          <Space wrap size={8}>
            <Tag color={props.priorityColor}>{props.priorityText}</Tag>
            <Tag color={props.statusTagColor}>{props.statusText}</Tag>
          </Space>
        </Space>

        <Flex
          align="end"
          justify="space-between"
          gap={16}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" size={8}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              快速操作
            </Typography.Text>
            <Space size={8}>
              <Select
                value={props.selectedStatus}
                style={{ width: 180 }}
                options={props.statusOptions}
                onChange={props.onStatusChange}
              />
              <Button
                loading={props.updatingStatus}
                disabled={!props.canApplyStatus}
                onClick={() => {
                  void props.onApplyStatus();
                }}
              >
                应用状态
              </Button>
            </Space>
          </Space>

          <Space size={8}>
            <Button
              type="primary"
              onClick={() => {
                void props.onEdit();
              }}
            >
              编辑任务
            </Button>
            <Button onClick={props.onClose}>关闭</Button>
          </Space>
        </Flex>
      </Space>
    </Card>
  );
};

export default TaskPreviewSummary;
