import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import type { ProjectTaskIteration } from '@/api/modules/project-task-iteration';
import type { OpenProps } from '@/components/KDrawer/types.ts';

import TaskPreviewDrawer from './#TaskPreviewDrawer';

/**
 * 任务详情抽屉默认激活的 Tab。
 */
export type TaskPreviewDrawerTabKey =
  | 'detail'
  | 'subtask'
  | 'dynamic'
  | 'changeLog';

interface OpenTaskPreviewDrawerOptions {
  /**
   * 抽屉首次打开时默认激活的 Tab。
   */
  initialTabKey?: TaskPreviewDrawerTabKey;
  onEdit: (task: ProjectTaskDetail) => Promise<boolean>;
  onTaskUpdated: () => Promise<void>;
  /**
   * 已加载的迭代列表。
   *
   * 任务详情抽屉里需要基于当前看板同一份迭代配置做快捷切换，
   * 避免详情抽屉重新请求时与看板筛选口径短暂不一致。
   */
  iterations?: ProjectTaskIteration[];
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
    title: '任务详情',
    /**
     * 任务说明已支持 Markdown 预览，适当放宽侧栏宽度以减少换行，
     * 让标题、代码块和图片的阅读体验更稳定。
     */
    size: 840,
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
        iterations={options.iterations}
        statusConfigs={options.statusConfigs}
        onTaskUpdated={options.onTaskUpdated}
        onEdit={options.onEdit}
        initialTabKey={options.initialTabKey}
      />
    ),
  });
}
