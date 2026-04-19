import { Card } from 'antd';
import { createFileRoute } from '@tanstack/react-router';

import TaskTypeTable from './#TaskTypeTable';

/**
 * 任务类型管理页面路由。
 */
export const Route = createFileRoute('/project/task-type/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card>
      <TaskTypeTable />
    </Card>
  );
}
