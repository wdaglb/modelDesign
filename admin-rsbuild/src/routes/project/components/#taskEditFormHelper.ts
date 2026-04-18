import dayjs, { type Dayjs } from 'dayjs';

import type {
  EditProjectTaskParams,
  ProjectTaskDetail,
  TaskPriority,
  TaskStatusCode,
} from '@/api/modules/project-task.types';

export interface TaskEditFormValues {
  assigneeId?: number;
  description?: string;
  dueTime?: Dayjs;
  priority: TaskPriority;
  projectId: number;
  startTime?: Dayjs;
  status: TaskStatusCode;
  title: string;
  workDays?: number;
}

export type TaskEditFormMode = 'drawer' | 'full';

/**
 * 规范化提交到接口的负责人值。
 *
 * 前端清空选择时需要继续传 0，才能让后端保持“未分配”语义。
 *
 * @param value 表单中的负责人值
 * @return 后端可接受的负责人值
 */
export function getSubmitAssigneeId(value?: number) {
  if (value === undefined) {
    return 0;
  }

  return value;
}

/**
 * 校验预计工时输入值。
 *
 * 任务工时沿用现有 0.5 人天步进规则，避免抽屉编辑态与旧表单行为不一致。
 *
 * @param value 当前工时值
 * @return 是否通过校验
 */
export function validateWorkDaysValue(value?: number | null) {
  if (value === undefined || value === null) {
    return true;
  }

  if (value <= 0) {
    return false;
  }

  if (!Number.isInteger(value * 2)) {
    return false;
  }

  return true;
}

/**
 * 构造编辑表单初始值。
 *
 * @param task 当前任务详情
 * @return 表单初始值
 */
export function buildTaskEditInitialValues(
  task: ProjectTaskDetail,
): TaskEditFormValues {
  return {
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    assigneeId: task.assigneeId,
    status: task.status,
    priority: task.priority,
    workDays: task.workDays,
    startTime: task.startTime ? dayjs(task.startTime) : undefined,
    dueTime: task.dueTime ? dayjs(task.dueTime) : undefined,
  };
}

/**
 * 组装编辑接口 payload。
 *
 * drawer 模式只编辑设计稿显式暴露的核心字段，其余字段必须回填旧值，
 * 否则会把后端已有排期信息意外清空。
 *
 * @param task 当前任务详情
 * @param values 表单值
 * @param mode 当前编辑模式
 * @return 编辑接口请求参数
 */
export function buildTaskEditPayload(
  task: ProjectTaskDetail,
  values: TaskEditFormValues,
  mode: TaskEditFormMode,
): EditProjectTaskParams {
  const payload: EditProjectTaskParams = {
    parentTaskId: task.parentTaskId,
    title: values.title,
    description: values.description,
    status: values.status,
    priority: values.priority,
    workDays: values.workDays,
    assigneeId: getSubmitAssigneeId(values.assigneeId),
  };

  if (mode === 'full') {
    payload.startTime = values.startTime
      ? dayjs(values.startTime).format('YYYY-MM-DD HH:mm:ss')
      : undefined;
    payload.dueTime = values.dueTime
      ? dayjs(values.dueTime).format('YYYY-MM-DD HH:mm:ss')
      : undefined;
    return payload;
  }

  payload.startTime = task.startTime;
  payload.dueTime = task.dueTime;
  return payload;
}
