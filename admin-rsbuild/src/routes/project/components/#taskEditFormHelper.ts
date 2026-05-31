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
  iterationId?: number;
  priority: TaskPriority;
  projectId: number;
  startTime?: Dayjs;
  status: TaskStatusCode;
  typeId?: number;
  title: string;
  workDays?: number;
}

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
 * 任务工时沿用现有 0.5 人天步进规则，避免不同入口保存后的工时口径不一致。
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
  const initialValues: TaskEditFormValues = {
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    assigneeId: task.assigneeId,
    iterationId: task.iterationId,
    typeId: task.typeId,
    status: task.status,
    priority: task.priority,
    workDays: task.workDays,
  };

  if (task.startTime) {
    initialValues.startTime = dayjs(task.startTime);
  }
  if (task.dueTime) {
    initialValues.dueTime = dayjs(task.dueTime);
  }

  return initialValues;
}

/**
 * 格式化提交给后端的日期时间字段。
 *
 * Ant Design DatePicker 返回 Dayjs 对象，接口仍使用项目统一的字符串时间格式；
 * 未选择时显式返回 undefined，交给后端按清空排期处理。
 *
 * @param value 表单日期值
 * @return 接口日期字符串
 */
function formatSubmitDateTime(value?: Dayjs) {
  if (!value) {
    return undefined;
  }

  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 组装编辑接口 payload。
 *
 * 任务编辑只保留弹窗入口后，所有字段统一由弹窗表单提交，避免详情抽屉和
 * 编辑窗口分别维护排期、项目、负责人等字段的回填规则。
 *
 * @param task 当前任务详情
 * @param values 表单值
 * @return 编辑接口请求参数
 */
export function buildTaskEditPayload(
  task: ProjectTaskDetail,
  values: TaskEditFormValues,
): EditProjectTaskParams {
  return {
    projectId: values.projectId,
    parentTaskId: resolveSubmitParentTaskId(task, values),
    title: values.title,
    description: values.description,
    typeId: values.typeId as number,
    iterationId: values.iterationId,
    status: values.status,
    priority: values.priority,
    workDays: values.workDays,
    assigneeId: getSubmitAssigneeId(values.assigneeId),
    startTime: formatSubmitDateTime(values.startTime),
    dueTime: formatSubmitDateTime(values.dueTime),
  };
}

/**
 * 解析提交时的父任务 ID。
 *
 * 跨项目移动任务时，旧父任务一定属于原项目，继续提交会让后端校验失败并产生
 * 跨项目父子关系风险。因此前端在项目变化时不再回填旧父任务，由后端按移动
 * 语义解除父子关系。
 *
 * @param task 当前任务详情
 * @param values 表单值
 * @return 可提交给后端的父任务 ID
 */
function resolveSubmitParentTaskId(
  task: ProjectTaskDetail,
  values: TaskEditFormValues,
) {
  if (values.projectId !== task.projectId) {
    return undefined;
  }

  return task.parentTaskId;
}
