import { createFileRoute } from '@tanstack/react-router';
import { Typography } from 'antd';

import TaskDetailView from './#TaskDetailView';
import {
  taskDrawerDemoChangeLogs,
  taskDrawerDemoDynamics,
  taskDrawerDemoStatusConfigs,
  taskDrawerDemoSubtasks,
  taskDrawerDemoTask,
} from './#taskDrawerDemoData';
import {
  TaskDrawerDemoPage,
  TaskDrawerDemoRow,
  TaskDrawerDemoShell,
} from './styles/task-detail-drawer.styled';
import TaskEditForm from '@/routes/project/components/#TaskEditForm';

export const Route = createFileRoute('/agile-board/task-drawer-demo')({
  component: TaskDrawerDemoRoute,
});

/**
 * 任务抽屉 demo 路由。
 *
 * 这里同时摆出查看态与编辑态，方便直接对照 Pencil 双画布做视觉确认。
 */
function TaskDrawerDemoRoute() {
  return (
    <TaskDrawerDemoPage>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 8 }}>
          任务详情抽屉 Demo
        </Typography.Title>
        <Typography.Text type={'secondary'}>
          左侧为查看态，右侧为编辑态，两者都按 Pencil 设计稿结构搭建。
        </Typography.Text>
      </div>

      <TaskDrawerDemoRow>
        <div>
          <Typography.Title level={5}>查看态</Typography.Title>
          <TaskDrawerDemoShell>
            <TaskDetailView
              task={taskDrawerDemoTask}
              statusConfigs={taskDrawerDemoStatusConfigs}
              previewSubtasks={taskDrawerDemoSubtasks}
              previewChangeLogs={taskDrawerDemoChangeLogs}
              previewDynamics={taskDrawerDemoDynamics}
              onTaskUpdated={async () => undefined}
              onEditTask={async () => undefined}
              onEnterEdit={() => undefined}
            />
          </TaskDrawerDemoShell>
        </div>

        <div>
          <Typography.Title level={5}>编辑态</Typography.Title>
          <TaskDrawerDemoShell>
            <TaskEditForm
              mode={'drawer'}
              task={taskDrawerDemoTask}
              statusConfigs={taskDrawerDemoStatusConfigs}
              previewSubtasks={taskDrawerDemoSubtasks}
              previewChangeLogs={taskDrawerDemoChangeLogs}
              onCancel={() => undefined}
              onSuccess={async () => undefined}
              onSubmitOverride={async () => undefined}
              onOpenFullEdit={async () => undefined}
            />
          </TaskDrawerDemoShell>
        </div>
      </TaskDrawerDemoRow>
    </TaskDrawerDemoPage>
  );
}
