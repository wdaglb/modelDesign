import type { ProjectTaskDetail, TaskStatusCode } from '@/api/modules/project-task.types';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';

/**
 * 解析快捷创建子任务时使用的初始状态。
 *
 * 规则沿用旧子任务面板：按 sort 升序取第一个状态，避免抽屉内快捷创建
 * 与历史行为出现语义偏差。
 *
 * @param statusConfigs 状态配置列表
 * @return 初始状态编码
 */
export function resolveInitialSubtaskStatus(
  statusConfigs: TaskStatusConfig[],
): TaskStatusCode | undefined {
  if (!statusConfigs.length) {
    return undefined;
  }

  const sortedConfigs = [...statusConfigs].sort((a, b) => a.sort - b.sort);
  return sortedConfigs[0]?.code;
}

/**
 * 组装快捷创建子任务的最小 payload。
 *
 * 子任务默认继承父任务的项目、优先级与负责人，和历史抽屉能力保持一致。
 *
 * @param parentTask 父任务详情
 * @param title 子任务标题
 * @param status 初始状态
 * @return 创建参数
 */
export function buildQuickCreateSubtaskPayload(
  parentTask: ProjectTaskDetail,
  title: string,
  status: TaskStatusCode,
) {
  return {
    projectId: parentTask.projectId,
    parentTaskId: parentTask.id,
    title: title.trim(),
    typeId: parentTask.typeId as number,
    status,
    priority: parentTask.priority,
    assigneeId: parentTask.assigneeId,
  };
}
