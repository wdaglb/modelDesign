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
 * 我的待办状态。
 */
export enum TodoStatus {
  /**
   * 待处理。
   */
  Pending = 'pending',
  /**
   * 处理中。
   */
  Processing = 'processing',
  /**
   * 已完成。
   */
  Completed = 'completed',
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
  [TodoStatus.Pending]: '待处理',
  [TodoStatus.Processing]: '处理中',
  [TodoStatus.Completed]: '已完成',
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
  TodoStatus.Pending,
  TodoStatus.Processing,
  TodoStatus.Completed,
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
