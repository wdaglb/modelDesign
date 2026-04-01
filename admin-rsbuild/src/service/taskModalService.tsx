import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { OpenProps } from '@/components/KModal/types.ts';

import TaskCreateForm from '@/routes/project/components/#TaskCreateForm';

interface OpenTaskModalOptions {
  /**
   * 弹窗高度。
   */
  bodyHeight?: number;

  /**
   * 默认项目 ID。
   */
  projectId?: number;

  /**
   * 编辑时传入的任务详情。
   */
  task?: ProjectTaskDetail;

  /**
   * 状态配置列表。
   */
  statusConfigs?: TaskStatusConfig[];

  /**
   * 弹窗宽度。
   */
  width?: number;
}

interface KModalInstance {
  /**
   * 打开弹窗。
   *
   * @param props 弹窗参数
   * @return 弹窗结果
   */
  open<T = any>(props: OpenProps): Promise<T>;
}

/**
 * 打开任务弹窗。
 *
 * 统一处理新建/编辑标题、尺寸和取消关闭逻辑。
 *
 * @param modal KModal 实例
 * @param options 弹窗选项
 * @return 是否完成任务表单提交
 */
export async function openTaskModal(
  modal: KModalInstance,
  options: OpenTaskModalOptions = {},
) {
  let title = '新建任务';

  if (options.task) {
    title = '编辑任务';
  }

  let width = 1280;
  if (options.width !== undefined) {
    width = options.width;
  }

  let bodyHeight = 720;
  if (options.bodyHeight !== undefined) {
    bodyHeight = options.bodyHeight;
  }

  try {
    await modal.open({
      title,
      width,
      styles: {
        body: {
          height: bodyHeight,
          overflowX: 'hidden',
          overflowY: 'auto',
        },
      },
      children: (
        <TaskCreateForm
          projectId={options.projectId}
          task={options.task}
          statusConfigs={options.statusConfigs}
        />
      ),
    });
    return true;
  } catch (error) {
    if (error === 'KModal cancel') {
      return false;
    }

    throw error;
  }
}
