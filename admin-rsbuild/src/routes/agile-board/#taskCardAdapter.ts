import type { TaskCardTask } from '@/components';

import type { AgileBoardTask } from './#types';
import { resolveTaskNumberText } from './#helper';

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
export function mapAgileBoardTaskToTaskCardTask(
  task: AgileBoardTask,
): TaskCardTask {
  return {
    id: task.id,
    taskNumber: resolveTaskNumberText(task),
    projectName: normalizeTaskText(task.projectName),
    title: task.title,
    priority: task.priority,
    workDays: task.workDays,
    assignee: normalizeTaskText(task.assignee),
    dueTime: normalizeTaskText(task.dueTime),
  };
}
