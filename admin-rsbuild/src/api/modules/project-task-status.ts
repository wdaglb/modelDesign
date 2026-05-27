import request from '@/utils/request';

/**
 * 任务状态配置。
 */
export interface TaskStatusConfig {
  /**
   * 状态编码。
   */
  code: string;

  /**
   * 状态名称。
   */
  name: string;

  /**
   * 排序值。
   */
  sort: number;

  /**
   * 是否为完成状态。
   */
  isCompleted: boolean;

  /**
   * 是否显示在敏捷面板。
   */
  showInAgileBoard: boolean;
}

/**
 * 任务状态保存项。
 */
export interface TaskStatusSaveItem {
  /**
   * 状态编码。
   */
  code: string;

  /**
   * 状态名称。
   */
  name: string;

  /**
   * 是否为完成状态。
   */
  isCompleted: boolean;

  /**
   * 是否显示在敏捷面板。
   */
  showInAgileBoard: boolean;
}

/**
 * 任务状态整表保存请求。
 */
export interface TaskStatusSaveParams {
  /**
   * 状态列表。
   */
  statuses: TaskStatusSaveItem[];
}

/**
 * 获取任务状态配置列表。
 */
export const getList = () => {
  return request<TaskStatusConfig[]>('/project/task-status/list', {
    method: 'get',
  });
};

/**
 * 保存任务状态配置。
 */
export const save = (data: TaskStatusSaveParams) => {
  return request<TaskStatusConfig[]>('/project/task-status/save', {
    method: 'post',
    data,
  });
};
