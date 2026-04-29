import type { TaskCardTask } from '@/components';

import type { ProjectTaskType } from '@/api/modules/project-task-type';
import type { AgileBoardTask } from './#types';
import { resolveTaskNumberText } from './#helper';
import { resolveTaskBranchName } from './#taskDetailTypeHelper';

/**
 * 规范化任务字段，空字符串会回退为 undefined。
 *
 * 约束：
 * - 统一卡片组件会基于 undefined 展示默认文案；
 * - 这里不直接写入兜底文案，避免与通用组件文案重复定义。
 *
 * @param value 原始值
 * @returns 规范化结果
 */
function normalizeTaskText(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return undefined;
  }

  return normalizedValue;
}

/**
 * 规整敏捷面板卡片使用的截止时间文本。
 *
 * 说明：
 * - 敏捷面板卡片只保留日期，不展示时分秒；
 * - 其它详情页与编辑页仍沿用原始时间字符串，本适配仅作用于卡片层展示。
 *
 * @param value 原始截止时间
 * @returns 仅保留日期的截止时间文本
 */
function normalizeBoardDueTimeText(value: string | null | undefined) {
  const normalizedValue = normalizeTaskText(value);

  if (!normalizedValue) {
    return undefined;
  }

  if (normalizedValue.length >= 10) {
    return normalizedValue.slice(0, 10);
  }

  return normalizedValue;
}

/**
 * 将敏捷看板任务映射为通用任务卡片数据结构。
 *
 * 默认文案说明：
 * - 未命名项目
 * - 未分配负责人
 * - 未设置截止时间
 * - 工时文案（无值时显示 -，有值时显示 x 人天）
 *
 * 以上文案由通用 TaskCard 内部统一渲染，本适配层仅负责
 * 将空值规整为 undefined，确保看板场景与历史行为一致。
 */
interface TaskCardTaskAdapterOptions {
  /**
   * 是否为完成态任务。
   */
  isCompleted?: boolean;

  /**
   * 当前登录用户 Git 用户名。
   */
  gitUsername?: string;

  /**
   * 当前租户可选任务类型。
   */
  taskTypes?: ProjectTaskType[];
}

export function mapAgileBoardTaskToTaskCardTask(
  task: AgileBoardTask,
  options?: TaskCardTaskAdapterOptions,
): TaskCardTask {
  return {
    id: task.id,
    taskNumber: resolveTaskNumberText(task),
    branchName: resolveTaskBranchName(
      task,
      options?.gitUsername,
      options?.taskTypes,
    ),
    projectName: normalizeTaskText(task.projectName),
    typeName: normalizeTaskText(task.typeName),
    title: task.title,
    /**
     * 敏捷面板卡片不展示最新动态摘要，避免同列卡片出现不同高度。
     */
    latestDynamicSummary: undefined,
    priority: task.priority,
    workDays: task.workDays,
    assignee: normalizeTaskText(task.assignee),
    dueTime: normalizeBoardDueTimeText(task.dueTime),
    isCompleted: options?.isCompleted,
  };
}
