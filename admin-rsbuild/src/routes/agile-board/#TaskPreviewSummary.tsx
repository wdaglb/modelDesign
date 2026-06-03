import { Button, Select, Space, Tag, Typography } from 'antd';

import type { TaskStatusCode } from '@/api/modules/project-task.types';

import {
  TaskPreviewProjectText,
  TaskPreviewQuickActions,
  TaskPreviewSummaryCard,
  TaskPreviewSummaryMain,
  TaskPreviewSummaryMeta,
  TaskPreviewTaskNumberText,
  TaskPreviewTitle,
  TaskPreviewVerticalStack,
} from './styles/task-preview-drawer.styled';

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
  taskLinkText: string;
  taskNumberText: string;
  title: string;
  updatingStatus: boolean;
}

/**
 * 任务预览摘要头。
 */
const TaskPreviewSummary = (props: TaskPreviewSummaryProps) => {
  return (
    <TaskPreviewSummaryCard size="small">
      <TaskPreviewVerticalStack>
        <TaskPreviewSummaryMain>
          <TaskPreviewSummaryMeta>
            <Typography.Text type="secondary">
              <TaskPreviewProjectText>{props.projectText}</TaskPreviewProjectText>
            </Typography.Text>
            <Space wrap size={12}>
              <Typography.Text
                copyable={{ text: props.taskNumberText }}
              >
                <TaskPreviewTaskNumberText>
                  {`# ${props.taskNumberText}`}
                </TaskPreviewTaskNumberText>
              </Typography.Text>
              <Typography.Text
                copyable={{ text: props.taskLinkText }}
                type={'secondary'}
              >
                任务链接
              </Typography.Text>
            </Space>
            <Typography.Text copyable={{ text: props.title }}>
              <TaskPreviewTitle>{props.title}</TaskPreviewTitle>
            </Typography.Text>
            <Space wrap size={8}>
              <Tag color={props.priorityColor}>{props.priorityText}</Tag>
              <Tag color={props.statusTagColor}>{props.statusText}</Tag>
            </Space>
          </TaskPreviewSummaryMeta>

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
        </TaskPreviewSummaryMain>

        <TaskPreviewQuickActions>
          <TaskPreviewVerticalStack>
            <Typography.Text type="secondary">快速操作</Typography.Text>
            <Space size={8} wrap>
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
          </TaskPreviewVerticalStack>
        </TaskPreviewQuickActions>
      </TaskPreviewVerticalStack>
    </TaskPreviewSummaryCard>
  );
};

export default TaskPreviewSummary;
