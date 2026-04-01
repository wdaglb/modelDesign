import type {
  ProjectTaskDetail,
  ProjectTaskSortField,
  ProjectTaskSortOrder,
} from '@/api/modules/project-task.types';

/**
 * 任务表格行数据。
 */
export type ProjectTaskItem = ProjectTaskDetail;

/**
 * 可编辑的任务字段。
 */
export type EditableField =
  | 'assigneeId'
  | 'priority'
  | 'status'
  | 'startTime'
  | 'dueTime';

/**
 * 当前编辑中的单元格。
 */
export interface EditingCell {
  taskId: number;
  field: EditableField;
}

/**
 * 表格排序状态。
 */
export interface TaskSorterState {
  field?: ProjectTaskSortField;
  order?: ProjectTaskSortOrder;
}

/**
 * 下拉选项结构。
 */
export interface CellOption {
  label: string;
  value: string | number;
}

/**
 * 任务列表分页状态。
 */
export interface TaskPaginationState {
  current: number;
  pageSize: number;
}
