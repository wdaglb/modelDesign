import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import type { OpenProps } from '@/components/KDrawer/types.ts';

import TaskPreviewDrawer from './#TaskPreviewDrawer';

interface OpenTaskPreviewDrawerOptions {
  onEdit: (task: ProjectTaskDetail) => Promise<void>;
  onTaskUpdated: () => Promise<void>;
  statusConfigs: TaskStatusConfig[];
  taskId: number;
}

interface KDrawerInstance {
  /**
   * 打开抽屉。
   *
   * @param props 抽屉参数
   * @return 抽屉结果
   */
  open<T = any>(props: OpenProps): Promise<T>;
}

/**
 * 打开任务预览抽屉。
 */
export async function openTaskPreviewDrawer(
  drawer: KDrawerInstance,
  options: OpenTaskPreviewDrawerOptions,
) {
  await drawer.open({
    title: '任务预览',
    /**
     * 任务说明已支持 Markdown 预览，适当放宽侧栏宽度以减少换行，
     * 让标题、代码块和图片的阅读体验更稳定。
     */
    size: 900,
    styles: {
      body: {
        padding: 0,
        height: '100%',
        overflow: 'hidden',
      },
    },
    children: (
      <TaskPreviewDrawer
        taskId={options.taskId}
        statusConfigs={options.statusConfigs}
        onTaskUpdated={options.onTaskUpdated}
        onEdit={options.onEdit}
      />
    ),
  });
}
