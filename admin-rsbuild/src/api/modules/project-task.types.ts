import type { PageResponse } from './project.types';

/**
 * 任务优先级。
 */
export enum TaskPriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export const TaskPriorityLabel: Record<TaskPriority, string> = {
  [TaskPriority.High]: '高',
  [TaskPriority.Medium]: '中',
  [TaskPriority.Low]: '低',
};

export const TaskPriorityOptions = [
  TaskPriority.High,
  TaskPriority.Medium,
  TaskPriority.Low,
].map((item) => ({
  label: TaskPriorityLabel[item],
  value: item,
}));

/**
 * 任务状态。
 */
export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'inProgress',
  Done = 'done',
  Canceled = 'canceled',
}

export const TaskStatusLabel: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: '待处理',
  [TaskStatus.InProgress]: '进行中',
  [TaskStatus.Done]: '已完成',
  [TaskStatus.Canceled]: '已取消',
};

export const TaskStatusOptions = [
  TaskStatus.Todo,
  TaskStatus.InProgress,
  TaskStatus.Done,
  TaskStatus.Canceled,
].map((item) => ({
  label: TaskStatusLabel[item],
  value: item,
}));

/**
 * 任务列表排序字段。
 */
export enum ProjectTaskSortField {
  Priority = 'priority',
  StartTime = 'startTime',
}

/**
 * 任务列表排序方向。
 */
export enum ProjectTaskSortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

/**
 * 创建项目任务请求参数。
 */
export interface CreateProjectTaskParams {
  /** 项目 ID。 */
  projectId: number;
  /** 任务标题。 */
  title: string;
  /** 任务描述。 */
  description?: string;
  /** 任务状态。 */
  status: TaskStatus;
  /** 任务优先级。 */
  priority: TaskPriority;
  /** 负责人 ID。 */
  assigneeId?: number;
  /** 开始时间（ISO 格式）。 */
  startTime?: string;
  /** 截止时间（ISO 格式）。 */
  dueTime?: string;
}

/**
 * 编辑项目任务请求参数。
 */
export interface EditProjectTaskParams {
  /** 任务标题。 */
  title: string;
  /** 任务描述。 */
  description?: string;
  /** 任务状态。 */
  status: TaskStatus;
  /** 任务优先级。 */
  priority: TaskPriority;
  /** 负责人 ID。 */
  assigneeId?: number;
  /** 开始时间（ISO 格式）。 */
  startTime?: string;
  /** 截止时间（ISO 格式）。 */
  dueTime?: string;
}

/**
 * 项目任务列表查询参数。
 */
export interface ProjectTaskListParams {
  /** 项目 ID。 */
  projectId: number;
  /** 当前页码。 */
  current?: number;
  /** 每页条数。 */
  pageSize?: number;
  /** 标题关键字。 */
  title?: string;
  /** 任务状态。 */
  status?: TaskStatus;
  /** 任务优先级。 */
  priority?: TaskPriority;
  /** 负责人 ID。 */
  assigneeId?: number;
  /** 排序字段。 */
  sortField?: ProjectTaskSortField;
  /** 排序方向。 */
  sortOrder?: ProjectTaskSortOrder;
}

/**
 * 项目任务详情。
 */
export interface ProjectTaskDetail {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: number;
  assignee?: string;
  creatorId?: number;
  creator?: string;
  startTime?: string;
  dueTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 项目任务分页响应。
 */
export type ProjectTaskPageResponse = PageResponse<ProjectTaskDetail>;
