import { PageResponse } from './project.types';

/**
 * 我的待办优先级。
 */
export enum TodoPriority {
  /**
   * 高优先级。
   */
  High = 'high',
  /**
   * 中优先级。
   */
  Medium = 'medium',
  /**
   * 低优先级。
   */
  Low = 'low',
}

/**
 * 我的待办状态（与后端 ProjectTask.status 保持一致）。
 */
export enum TodoStatus {
  /**
   * 待执行。
   */
  Todo = 'todo',
  /**
   * 执行中。
   */
  InProgress = 'inProgress',
  /**
   * 待测试。
   */
  PendingTest = 'pendingTest',
  /**
   * 待发布。
   */
  PendingRelease = 'pendingRelease',
  /**
   * 已完成。
   */
  Done = 'done',
  /**
   * 已取消。
   */
  Canceled = 'canceled',
}

/**
 * 我的待办优先级中文映射。
 */
export const TodoPriorityLabel = {
  [TodoPriority.High]: '高',
  [TodoPriority.Medium]: '中',
  [TodoPriority.Low]: '低',
};

/**
 * 我的待办状态中文映射。
 */
export const TodoStatusLabel = {
  [TodoStatus.Todo]: '待执行',
  [TodoStatus.InProgress]: '执行中',
  [TodoStatus.PendingTest]: '待测试',
  [TodoStatus.PendingRelease]: '待发布',
  [TodoStatus.Done]: '已完成',
  [TodoStatus.Canceled]: '已取消',
};

/**
 * 我的待办优先级选项。
 */
export const TodoPriorityOptions = [
  TodoPriority.High,
  TodoPriority.Medium,
  TodoPriority.Low,
].map((item) => ({
  label: TodoPriorityLabel[item],
  value: item,
}));

/**
 * 我的待办状态选项。
 */
export const TodoStatusOptions = [
  TodoStatus.Todo,
  TodoStatus.InProgress,
  TodoStatus.PendingTest,
  TodoStatus.PendingRelease,
  TodoStatus.Done,
  TodoStatus.Canceled,
].map((item) => ({
  label: TodoStatusLabel[item],
  value: item,
}));

/**
 * 我的待办列表项。
 */
export interface TodoItem {
  /**
   * 任务 ID。
   */
  id: number;

  /**
   * 标题。
   */
  title: string;

  /**
   * 接收时间。
   */
  receivedAt: string;

  /**
   * 优先级。
   */
  priority: TodoPriority;

  /**
   * 预计工时（人天）。
   */
  workDays?: number;

  /**
   * 状态。
   */
  status: TodoStatus;

  /**
   * 发起人名称。
   */
  initiatorName: string;

  /**
   * 所属项目 ID。
   */
  projectId?: number;

  /**
   * 所属项目名称。
   */
  projectName?: string;
}

/**
 * 我的待办列表查询参数。
 */
export interface TodoListParams {
  /**
   * 当前页码。
   */
  current?: number;

  /**
   * 每页条数。
   */
  pageSize?: number;

  /**
   * 标题关键字。
   */
  title?: string;

  /**
   * 优先级。
   */
  priority?: TodoPriority;

  /**
   * 状态。
   */
  status?: TodoStatus;
}

/**
 * 我的待办分页响应。
 */
export type TodoPageResponse = PageResponse<TodoItem>;
