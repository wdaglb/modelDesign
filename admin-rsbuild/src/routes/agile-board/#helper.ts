import type { CSSProperties } from 'react';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import {
  TaskPriority,
  TaskPriorityLabel,
  type EditProjectTaskParams,
  type ProjectTaskDetail,
  type TaskStatusCode,
} from '@/api/modules/project-task.types';
import { RequestError } from '@/api/types';

import type {
  AgileBoardColumnMeta,
  AgileBoardFilterState,
  AgileBoardQueryParams,
  AgileBoardTask,
  AgileBoardTaskGroup,
} from './#types';

const BOARD_ACCENT_COLORS = [
  '#d97706',
  '#2563eb',
  '#0891b2',
  '#4338ca',
  '#7c3aed',
  '#db2777',
];

const BOARD_BACKGROUND_COLORS = [
  'rgba(245, 158, 11, 0.05)',
  'rgba(37, 99, 235, 0.05)',
  'rgba(8, 145, 178, 0.05)',
  'rgba(67, 56, 202, 0.05)',
  'rgba(124, 58, 237, 0.05)',
  'rgba(219, 39, 119, 0.05)',
];

const COMPLETED_ACCENT_COLOR = '#15803d';
const COMPLETED_BACKGROUND = 'rgba(21, 128, 61, 0.05)';
const HISTORY_ACCENT_COLOR = '#6b7280';
const HISTORY_BACKGROUND = 'rgba(107, 114, 128, 0.05)';

/**
 * 规范化标题关键字。
 */
export function normalizeBoardKeyword(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  return trimmedValue;
}

/**
 * 判断输入是否更像任务编号。
 */
export function isLikelyTaskCode(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return false;
  }

  if (/\s/.test(normalizedValue)) {
    return false;
  }

  if (/^\d+$/.test(normalizedValue)) {
    return true;
  }

  if (/^.+-\d+$/.test(normalizedValue)) {
    return true;
  }

  return false;
}

/**
 * 敏捷面板搜索依赖。
 */
export interface BoardTitleSearchDeps {
  getDetailByCode: (code: string) => Promise<ProjectTaskDetail>;
  onOpenPreview: (task: ProjectTaskDetail) => Promise<void> | void;
  onFallbackSearch: (title: string) => void;
}

/**
 * 处理敏捷面板标题搜索逻辑。
 */
export async function handleBoardTitleSearch(
  value: string,
  deps: BoardTitleSearchDeps,
) {
  const normalizedValue = normalizeBoardKeyword(value);

  if (!normalizedValue) {
    deps.onFallbackSearch('');
    return;
  }

  const shouldSearchByCode = isLikelyTaskCode(normalizedValue);
  if (!shouldSearchByCode) {
    deps.onFallbackSearch(normalizedValue);
    return;
  }

  let detail: ProjectTaskDetail;

  try {
    detail = await deps.getDetailByCode(normalizedValue);
  } catch (error) {
    if (error instanceof RequestError && error.code === 404) {
      deps.onFallbackSearch(normalizedValue);
      return;
    }

    throw error;
  }

  await deps.onOpenPreview(detail);
}

/**
 * 构建敏捷面板请求参数。
 */
export function buildBoardQueryParams(
  filters: AgileBoardFilterState,
): AgileBoardQueryParams {
  return {
    title: normalizeBoardKeyword(filters.title),
    projectId: filters.projectId,
    assigneeId: filters.assigneeId,
    priority: filters.priority,
  };
}

/**
 * 构建敏捷面板列配置。
 */
export function buildAgileBoardColumns(
  statusConfigs: TaskStatusConfig[],
  tasks: AgileBoardTask[],
) {
  const columns: AgileBoardColumnMeta[] = [];
  const existingStatusSet = new Set<string>();

  statusConfigs.forEach((statusConfig, index) => {
    existingStatusSet.add(statusConfig.code);
    columns.push(buildColumnMeta(statusConfig, index));
  });

  const historyStatusCodes = collectHistoryStatusCodes(tasks, existingStatusSet);
  historyStatusCodes.forEach((statusCode) => {
    columns.push({
      status: statusCode,
      title: `${statusCode}（历史状态）`,
      isCompleted: false,
      accentColor: HISTORY_ACCENT_COLOR,
      background: HISTORY_BACKGROUND,
      isHistory: true,
    });
  });

  return columns;
}

/**
 * 构建敏捷面板分组结果。
 */
export function groupBoardTasks(
  tasks: AgileBoardTask[],
  columns: AgileBoardColumnMeta[],
): AgileBoardTaskGroup {
  const groupedTasks: AgileBoardTaskGroup = {};

  columns.forEach((column) => {
    groupedTasks[column.status] = [];
  });

  tasks.forEach((task) => {
    if (!groupedTasks[task.status]) {
      groupedTasks[task.status] = [];
    }
    groupedTasks[task.status].push(task);
  });

  return groupedTasks;
}

/**
 * 筛选敏捷面板中的父任务列表。
 */
export function filterBoardParentTasks(tasks: AgileBoardTask[]) {
  return tasks.filter((task) => {
    return task.parentTaskId === undefined || task.parentTaskId === null;
  });
}

/**
 * 按父任务 ID 分组子任务。
 */
export function groupBoardSubtasks(subtasks: AgileBoardTask[]) {
  const grouped = new Map<number, AgileBoardTask[]>();

  subtasks.forEach((task) => {
    if (task.parentTaskId === undefined || task.parentTaskId === null) {
      return;
    }

    const taskGroup = grouped.get(task.parentTaskId);
    if (taskGroup) {
      taskGroup.push(task);
      return;
    }

    grouped.set(task.parentTaskId, [task]);
  });

  return grouped;
}

/**
 * 获取列拖拽标识。
 */
export function getColumnDragId(status: TaskStatusCode) {
  return `column:${status}`;
}

/**
 * 获取任务拖拽标识。
 */
export function getTaskDragId(taskId: number) {
  return `task:${taskId}`;
}

/**
 * 从拖拽落点中解析目标状态。
 */
export function resolveDropStatus(overId: string) {
  if (!overId.startsWith('column:')) {
    return undefined;
  }

  return overId.replace('column:', '');
}

/**
 * 构建状态流转请求体。
 */
export function buildBoardEditPayload(
  task: AgileBoardTask,
  patch?: Partial<EditProjectTaskParams>,
): EditProjectTaskParams {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    workDays: task.workDays,
    assigneeId: task.assigneeId,
    startTime: task.startTime,
    dueTime: task.dueTime,
    ...patch,
  };
}

/**
 * 获取任务负责人展示文案。
 */
export function getTaskAssigneeText(task: AgileBoardTask) {
  if (!task.assignee) {
    return '未分配负责人';
  }

  return task.assignee;
}

/**
 * 获取任务所属项目展示文案。
 */
export function getTaskProjectText(task: AgileBoardTask) {
  if (!task.projectName) {
    return '未命名项目';
  }

  return task.projectName;
}

/**
 * 获取截止时间展示文案。
 */
export function getTaskDueTimeText(task: AgileBoardTask) {
  if (!task.dueTime) {
    return '未设置截止时间';
  }

  return `截止 ${task.dueTime}`;
}

/**
 * 获取预计工时展示文案。
 */
export function getTaskWorkDaysText(task: AgileBoardTask) {
  if (task.workDays === undefined || task.workDays === null) {
    return '-';
  }

  return `${task.workDays} 人天`;
}

/**
 * 获取优先级标签文案。
 */
export function getTaskPriorityText(priority: TaskPriority) {
  return TaskPriorityLabel[priority];
}

/**
 * 获取敏捷面板任务优先级强调色。
 */
export function getBoardPriorityAccentColor(priority: TaskPriority) {
  if (priority === TaskPriority.High) {
    return '#dc2626';
  }

  if (priority === TaskPriority.Medium) {
    return '#d97706';
  }

  return '#2563eb';
}

/**
 * 构建敏捷面板卡片样式。
 */
export function getBoardCardStyle(
  isDragging: boolean | undefined,
  isOverlay: boolean | undefined,
  disabled: boolean | undefined,
): CSSProperties {
  let opacity = 1;
  let cursor = 'grab';
  let boxShadow = '0 6px 14px rgba(15, 23, 42, 0.08)';

  if (disabled) {
    cursor = 'default';
  }

  if (isDragging) {
    opacity = 0;
  }

  if (isOverlay) {
    boxShadow = '0 16px 30px rgba(15, 23, 42, 0.14)';
    cursor = 'grabbing';
  }

  return {
    opacity,
    cursor,
    width: '100%',
    boxShadow,
    transition: 'box-shadow 0.2s ease, opacity 0.2s ease',
  };
}

/**
 * 获取列副标题文案。
 */
export function getColumnSubtitle(isHistory: boolean | undefined) {
  if (isHistory) {
    return '历史状态';
  }

  return '';
}

/**
 * 获取任务状态展示文案。
 */
export function getBoardStatusText(
  status: TaskStatusCode,
  statusConfigs: TaskStatusConfig[],
) {
  const matchedStatus = statusConfigs.find((item) => item.code === status);

  if (matchedStatus) {
    return matchedStatus.name;
  }

  return `${status}（历史状态）`;
}

/**
 * 构建状态切换下拉选项。
 */
export function buildBoardStatusOptions(
  statusConfigs: TaskStatusConfig[],
  currentStatus: TaskStatusCode,
) {
  const options = statusConfigs.map((item) => {
    return {
      label: item.name,
      value: item.code,
    };
  });

  if (!currentStatus) {
    return options;
  }

  const exists = statusConfigs.some((item) => item.code === currentStatus);
  if (exists) {
    return options;
  }

  return [
    ...options,
    {
      label: `${currentStatus}（历史状态）`,
      value: currentStatus,
    },
  ];
}

function buildColumnMeta(statusConfig: TaskStatusConfig, index: number) {
  if (statusConfig.isCompleted) {
    return {
      status: statusConfig.code,
      title: statusConfig.name,
      isCompleted: true,
      accentColor: COMPLETED_ACCENT_COLOR,
      background: COMPLETED_BACKGROUND,
    };
  }

  const colorIndex = index % BOARD_ACCENT_COLORS.length;

  return {
    status: statusConfig.code,
    title: statusConfig.name,
    isCompleted: false,
    accentColor: BOARD_ACCENT_COLORS[colorIndex],
    background: BOARD_BACKGROUND_COLORS[colorIndex],
  };
}

function collectHistoryStatusCodes(
  tasks: AgileBoardTask[],
  existingStatusSet: Set<string>,
) {
  const historyStatusCodeSet = new Set<string>();

  tasks.forEach((task) => {
    if (!existingStatusSet.has(task.status)) {
      historyStatusCodeSet.add(task.status);
    }
  });

  return Array.from(historyStatusCodeSet);
}
