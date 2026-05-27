import type { TaskStatusCode } from '@/api/modules/project-task.types';
import { getTaskDragId, resolveDropStatus } from '../#helper';
import type { AgileBoardTask } from '../#types';

interface AgileBoardV2DropChange {
  nextStatus: TaskStatusCode;
  task: AgileBoardTask;
}

/**
 * 为 v2 看板构建拖拽任务索引。
 *
 * @param tasks 当前看板父任务列表
 * @returns 以拖拽 ID 为键的任务映射
 */
export function buildAgileBoardTaskMap(tasks: AgileBoardTask[]) {
  const nextTaskMap = new Map<string, AgileBoardTask>();

  tasks.forEach((task) => {
    nextTaskMap.set(getTaskDragId(task.id), task);
  });

  return nextTaskMap;
}

/**
 * 解析一次跨列拖拽最终是否需要触发状态流转。
 *
 * @param activeId 当前被拖拽任务的拖拽 ID
 * @param overId 当前落点的拖拽 ID
 * @param taskMap 看板任务映射
 * @returns 需要更新时返回任务与目标状态，否则返回 undefined
 */
export function resolveAgileBoardDropChange(
  activeId: string,
  overId: string | undefined,
  taskMap: Map<string, AgileBoardTask>,
): AgileBoardV2DropChange | undefined {
  if (!overId) {
    return undefined;
  }

  const task = taskMap.get(activeId);

  if (!task) {
    return undefined;
  }

  const nextStatus = resolveDropStatus(overId);

  if (!nextStatus) {
    return undefined;
  }

  if (task.status === nextStatus) {
    return undefined;
  }

  return {
    task,
    nextStatus: nextStatus as TaskStatusCode,
  };
}
