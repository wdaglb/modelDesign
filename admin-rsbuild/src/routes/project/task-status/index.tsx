import { Card } from 'antd';
import { createFileRoute } from '@tanstack/react-router';
import TaskStatusManager from './#TaskStatusManager';

/**
 * 任务状态管理页面路由。
 */
export const Route = createFileRoute('/project/task-status/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <TaskStatusManager />
    </Card>
  );
}
