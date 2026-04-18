import type { ReactNode } from 'react';
import { Typography } from 'antd';

import { TaskPreviewSectionCard } from './styles/task-preview-drawer.styled';

interface TaskPreviewSectionProps {
  children: ReactNode;
  title: string;
}

/**
 * 任务预览分组卡片。
 */
const TaskPreviewSection = (props: TaskPreviewSectionProps) => {
  return (
    <TaskPreviewSectionCard
      size="small"
      title={
        <Typography.Text strong style={{ fontSize: 16, lineHeight: '24px' }}>
          {props.title}
        </Typography.Text>
      }
    >
      {props.children}
    </TaskPreviewSectionCard>
  );
};

export default TaskPreviewSection;
