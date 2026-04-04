import type { HTMLAttributes } from 'react';

import type { TaskPriority } from '@/api/modules/project-task.types';

/**
 * 通用任务卡片的数据结构。
 */
export interface TaskCardTask {
  id: number;
  taskNumber?: string;
  projectName?: string;
  title: string;
  priority: TaskPriority;
  workDays?: number;
  assignee?: string;
  dueTime?: string;
}

/**
 * 任务优先级变更回调。
 */
export type TaskCardPriorityChangeHandler = (
  task: TaskCardTask,
  priority: TaskPriority,
) => Promise<void> | void;

/**
 * 任务卡片预览回调。
 */
export type TaskCardPreviewHandler = (
  task: TaskCardTask,
) => Promise<void> | void;

/**
 * 通用任务卡片属性。
 */
export interface TaskCardProps {
  task: TaskCardTask;
  disabled?: boolean;
  isOverlay?: boolean;
  onPreview?: TaskCardPreviewHandler;
  onPriorityChange?: TaskCardPriorityChangeHandler;
  rootProps?: HTMLAttributes<HTMLDivElement>;
}

/**
 * 任务优先级标签属性。
 */
export interface TaskCardPriorityTagProps {
  task: TaskCardTask;
  disabled?: boolean;
  isOverlay?: boolean;
  onPriorityChange?: TaskCardPriorityChangeHandler;
}
