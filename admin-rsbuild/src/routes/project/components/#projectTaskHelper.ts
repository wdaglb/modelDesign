import dayjs, { type Dayjs } from 'dayjs';
import type { TableProps } from 'antd';

import {
  ProjectTaskSortField,
  ProjectTaskSortOrder,
  TaskPriority,
  TaskPriorityOptions,
  TaskStatus,
  TaskStatusFilterOptions,
  TaskStatusOptions,
  type EditProjectTaskParams,
  type ProjectTaskDetail,
} from '@/api/modules/project-task.types';

import type { CellOption, TaskSorterState } from './#projectTaskTypes';

type TaskTableChangeSorter = Parameters<
  NonNullable<TableProps<ProjectTaskDetail>['onChange']>
>[2];

type TaskTableChangeAction = Parameters<
  NonNullable<TableProps<ProjectTaskDetail>['onChange']>
>[3]['action'];

export const UNASSIGNED_ASSIGNEE_VALUE = 0;
export const ALL_ASSIGNEE_FILTER_VALUE = -2;
export const ALL_PRIORITY_FILTER_VALUE = 'allPriority';
export const ALL_STATUS_FILTER_VALUE = 'allStatus';

/**
 * 优先级颜色映射。
 */
export const priorityColorMap: Record<TaskPriority, string> = {
  [TaskPriority.High]: 'red',
  [TaskPriority.Medium]: 'gold',
  [TaskPriority.Low]: 'blue',
};

/**
 * 状态颜色映射。
 */
export const statusColorMap: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'orange',
  [TaskStatus.InProgress]: 'blue',
  [TaskStatus.PendingTest]: 'cyan',
  [TaskStatus.PendingRelease]: 'geekblue',
  [TaskStatus.Done]: 'green',
  [TaskStatus.Canceled]: 'default',
};

export const priorityFilterOptions: CellOption[] = [
  {
    label: '全部优先级',
    value: ALL_PRIORITY_FILTER_VALUE,
  },
  ...TaskPriorityOptions,
];

export const statusFilterOptions: CellOption[] = [
  {
    label: '全部状态',
    value: ALL_STATUS_FILTER_VALUE,
  },
  ...TaskStatusFilterOptions,
];

/**
 * 获取负责人筛选选项。
 */
export function getAssigneeFilterOptions(memberOptions: CellOption[]) {
  return [
    {
      label: '全部负责人',
      value: ALL_ASSIGNEE_FILTER_VALUE,
    },
    ...memberOptions,
  ];
}

/**
 * 获取负责人编辑下拉选项。
 */
export function getAssigneeEditorOptions(
  memberOptions: CellOption[],
  assigneeId?: number,
) {
  if (assigneeId === undefined) {
    return memberOptions;
  }

  return [
    {
      label: '未分配',
      value: UNASSIGNED_ASSIGNEE_VALUE,
    },
    ...memberOptions,
  ];
}

/**
 * 规范化标题关键词。
 */
export function normalizeKeyword(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  return trimmedValue;
}

/**
 * 规范化数字类型的可选值。
 */
export function normalizeNumberValue(value?: string | number) {
  if (typeof value !== 'number') {
    return undefined;
  }

  return value;
}

export function normalizeAssigneeValue(value?: string | number) {
  return normalizeNumberValue(value);
}

/**
 * 规范化任务优先级枚举值。
 */
export function normalizeTaskPriority(value?: string | number) {
  if (value === TaskPriority.High) {
    return TaskPriority.High;
  }

  if (value === TaskPriority.Medium) {
    return TaskPriority.Medium;
  }

  if (value === TaskPriority.Low) {
    return TaskPriority.Low;
  }

  return undefined;
}

/**
 * 规范化任务状态枚举值。
 */
export function normalizeTaskStatus(value?: string | number) {
  if (value === TaskStatus.Todo) {
    return TaskStatus.Todo;
  }

  if (value === TaskStatus.InProgress) {
    return TaskStatus.InProgress;
  }

  if (value === TaskStatus.PendingTest) {
    return TaskStatus.PendingTest;
  }

  if (value === TaskStatus.PendingRelease) {
    return TaskStatus.PendingRelease;
  }

  if (value === TaskStatus.Done) {
    return TaskStatus.Done;
  }

  if (value === TaskStatus.Canceled) {
    return TaskStatus.Canceled;
  }

  return undefined;
}

export function getPriorityFilterValue(value?: TaskPriority) {
  if (!value) {
    return ALL_PRIORITY_FILTER_VALUE;
  }

  return value;
}

/**
 * 规范化优先级筛选值。
 */
export function normalizePriorityFilterValue(value?: string | number) {
  if (value === ALL_PRIORITY_FILTER_VALUE) {
    return undefined;
  }

  return normalizeTaskPriority(value);
}

export function getStatusFilterValue(value?: TaskStatus) {
  if (!value) {
    return ALL_STATUS_FILTER_VALUE;
  }

  return value;
}

/**
 * 规范化状态筛选值。
 */
export function normalizeStatusFilterValue(value?: string | number) {
  if (value === ALL_STATUS_FILTER_VALUE) {
    return undefined;
  }

  return normalizeTaskStatus(value);
}

export function getAssigneeFilterValue(value?: number) {
  if (value === undefined) {
    return ALL_ASSIGNEE_FILTER_VALUE;
  }

  return value;
}

/**
 * 规范化负责人筛选值。
 */
export function normalizeAssigneeFilterValue(value?: string | number) {
  if (value === ALL_ASSIGNEE_FILTER_VALUE) {
    return undefined;
  }

  return normalizeNumberValue(value);
}

/**
 * 解析日期字符串为 Dayjs 对象。
 */
export function parseDateValue(value?: string) {
  const normalizedValue = normalizeDateValue(value);

  if (!normalizedValue) {
    return null;
  }

  return dayjs(normalizedValue);
}

/**
 * 格式化 Dayjs 值为接口需要的时间字符串。
 */
export function formatDateValue(value: Dayjs | null) {
  if (!value) {
    return undefined;
  }

  return value.format('YYYY-MM-DD HH:mm:ss');
}

export function normalizeDateValue(value?: string) {
  if (!value) {
    return undefined;
  }

  return value;
}

export function getDateDisplayText(value?: string) {
  if (!value) {
    return '未设置';
  }

  return value;
}

export function getDateTextType(value?: string): 'secondary' | undefined {
  if (!value) {
    return 'secondary';
  }

  return undefined;
}

/**
 * 获取工时展示文案。
 */
export function getWorkDaysDisplayText(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }

  return `${value} 人天`;
}

/**
 * 获取任务列表空状态文案。
 */
export function getEmptyDescription(hasFilters: boolean, projectName?: string) {
  if (hasFilters) {
    return '未找到匹配的任务';
  }

  if (!projectName) {
    return '当前项目暂无任务';
  }

  return `${projectName}暂无任务`;
}

/**
 * 解析弹层挂载容器，避免弹出层定位错位。
 */
export function resolvePopupContainer(triggerNode: HTMLElement) {
  const parentElement = triggerNode.parentElement;

  if (!parentElement) {
    return document.body;
  }

  return parentElement;
}

/**
 * 转换为表格排序展示状态。
 */
export function getSortOrder(
  field: 'priority' | 'startTime',
  sorter: TaskSorterState,
): 'ascend' | 'descend' | null {
  if (sorter.field !== field) {
    return null;
  }

  if (!sorter.order) {
    return null;
  }

  if (sorter.order === ProjectTaskSortOrder.Asc) {
    return 'ascend';
  }

  return 'descend';
}

/**
 * 规范化任务表格排序结果。
 */
export function getNextTaskSorter(
  sorterValue: TaskTableChangeSorter,
  action?: TaskTableChangeAction,
): TaskSorterState | undefined {
  let normalizedSorter = sorterValue;

  if (action !== 'sort') {
    return undefined;
  }

  if (Array.isArray(sorterValue)) {
    normalizedSorter = sorterValue[0];
  }

  const nextOrder = normalizedSorter?.order;
  const nextField = normalizedSorter?.field;

  if (!nextOrder || !nextField) {
    return {};
  }

  if (
    nextField !== ProjectTaskSortField.Priority &&
    nextField !== ProjectTaskSortField.StartTime
  ) {
    return {};
  }

  if (nextOrder === 'ascend') {
    return {
      field: nextField,
      order: ProjectTaskSortOrder.Asc,
    };
  }

  return {
    field: nextField,
    order: ProjectTaskSortOrder.Desc,
  };
}

/**
 * 构造任务编辑请求体。
 */
export function buildEditPayload(
  task: ProjectTaskDetail,
  patch: Partial<EditProjectTaskParams>,
): EditProjectTaskParams {
  let nextAssigneeId = task.assigneeId;
  let nextStartTime = normalizeDateValue(task.startTime);
  let nextDueTime = normalizeDateValue(task.dueTime);
  let nextIterationId = task.iterationId;

  if (Object.prototype.hasOwnProperty.call(patch, 'assigneeId')) {
    nextAssigneeId = patch.assigneeId;
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'startTime')) {
    nextStartTime = patch.startTime;
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'dueTime')) {
    nextDueTime = patch.dueTime;
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'iterationId')) {
    nextIterationId = patch.iterationId;
  }

  return {
    title: patch.title ?? task.title,
    description: patch.description ?? task.description,
    typeId: patch.typeId ?? (task.typeId as number),
    iterationId: nextIterationId,
    status: patch.status ?? task.status,
    priority: patch.priority ?? task.priority,
    workDays: patch.workDays ?? task.workDays,
    assigneeId: nextAssigneeId,
    startTime: nextStartTime,
    dueTime: nextDueTime,
  };
}
