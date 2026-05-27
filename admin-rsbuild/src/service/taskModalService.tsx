import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import type { ProjectTaskIteration } from '@/api/modules/project-task-iteration';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { OpenProps } from '@/components/KModal/types.ts';

import TaskCreateForm from '@/routes/project/components/#TaskCreateForm';
import TaskEditForm from '@/routes/project/components/#TaskEditForm';

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
   * 新建时默认负责人 ID。
   */
  defaultAssigneeId?: number;

  /**
   * 新建时默认迭代 ID。
   */
  defaultIterationId?: number;

  /**
   * 已加载的迭代列表。
   */
  iterations?: ProjectTaskIteration[];

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
 * 这里保持对外签名不变，只在内部把“编辑任务”分流到新的 TaskEditForm，
 * 避免创建表单继续承载编辑职责。
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

  let children = (
    <TaskCreateForm
      projectId={options.projectId}
      defaultAssigneeId={options.defaultAssigneeId}
      defaultIterationId={options.defaultIterationId}
      iterations={options.iterations}
      task={options.task}
      statusConfigs={options.statusConfigs}
    />
  );

  if (options.task) {
    children = (
      <TaskEditForm
        mode={'full'}
        iterations={options.iterations}
        task={options.task}
        statusConfigs={options.statusConfigs}
      />
    );
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
      children,
    });
    return true;
  } catch (error) {
    if (error === 'KModal cancel') {
      return false;
    }

    throw error;
  }
}
