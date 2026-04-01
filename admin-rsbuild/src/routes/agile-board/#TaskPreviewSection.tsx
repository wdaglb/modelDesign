import type { ReactNode } from 'react';
import { Card, Typography } from 'antd';

interface TaskPreviewSectionProps {
  children: ReactNode;
  title: string;
}

/**
 * 任务预览分组卡片。
 */
const TaskPreviewSection = (props: TaskPreviewSectionProps) => {
  return (
    <Card
      size="small"
      styles={{
        body: {
          padding: 16,
        },
      }}
      title={
        <Typography.Text strong style={{ fontSize: 14 }}>
          {props.title}
        </Typography.Text>
      }
    >
      {props.children}
    </Card>
  );
};

export default TaskPreviewSection;
