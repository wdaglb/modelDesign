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
}

/**
 * 获取任务状态配置列表。
 */
export const getList = () => {
  return request<TaskStatusConfig[]>('/project/task-status/list', {
    method: 'get',
  });
};
