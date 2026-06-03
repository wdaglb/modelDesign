import { message } from 'antd';

import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import type { ProjectTaskIteration } from '@/api/modules/project-task-iteration';
import type { OpenProps } from '@/components/KDrawer/types.ts';
import Icons from '@/icons';
import { copyTextToClipboard } from '@/utils';

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
 * 构建任务详情抽屉标题。
 *
 * 标题右侧直接提供链接图标复制入口，避免详情内容区再占一段“任务链接”
 * 文案；分享地址仍只依赖 taskId，保证从任意入口打开时都能稳定复制。
 *
 * @param taskId 任务 ID
 * @return 抽屉标题节点
 */
export function buildTaskPreviewDrawerTitle(taskId: number) {
  const taskShareUrl = `${window.location.origin}/agile-board/?taskId=${taskId}`;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span>任务详情</span>
      <button
        type={'button'}
        aria-label={'复制任务链接'}
        title={'复制任务链接'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: 0,
          border: 0,
          background: 'transparent',
          color: '#4e5969',
          cursor: 'pointer',
        }}
        onClick={async (event) => {
          event.preventDefault();
          event.stopPropagation();

          try {
            await copyTextToClipboard(taskShareUrl);
            message.success('任务链接已复制');
          } catch {
            message.error('任务链接复制失败，请稍后重试');
          }
        }}
      >
        <Icons.LinkVariant />
      </button>
    </span>
  );
}

/**
 * 打开任务预览抽屉。
 */
export async function openTaskPreviewDrawer(
  drawer: KDrawerInstance,
  options: OpenTaskPreviewDrawerOptions,
) {
  await drawer.open({
    title: buildTaskPreviewDrawerTitle(options.taskId),
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
