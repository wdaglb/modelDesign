import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type {
  ProjectTaskBoardParams,
  ProjectTaskDetail,
  TaskPriority,
  TaskStatusCode,
} from '@/api/modules/project-task.types';

/**
 * 敏捷面板任务卡片。
 */
export type AgileBoardTask = ProjectTaskDetail & {
  /** 任务编号（看板展示优先）。 */
  taskNo?: string | null;
  /** 任务编码（历史字段）。 */
  taskCode?: string | null;
  /** 任务编码（通用字段）。 */
  code?: string | null;
  /** 序列号（兼容旧字段）。 */
  serialNumber?: string | number | null;
};

/**
 * 敏捷面板列元数据。
 */
export interface AgileBoardColumnMeta {
  status: TaskStatusCode;
  title: string;
  isCompleted: boolean;
  accentColor: string;
  background: string;
  isHistory?: boolean;
}

/**
 * 敏捷面板筛选状态。
 */
export interface AgileBoardFilterState {
  title: string;
  projectId?: number;
  assigneeId?: number;
  priority?: TaskPriority;
}

/**
 * 敏捷面板请求参数。
 */
export type AgileBoardQueryParams = ProjectTaskBoardParams;

/**
 * 敏捷面板任务分组。
 */
export type AgileBoardTaskGroup = Record<string, AgileBoardTask[]>;

/**
 * 任务状态配置映射。
 */
export type AgileBoardStatusConfigMap = Record<string, TaskStatusConfig>;
