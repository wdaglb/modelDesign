import type { PageResponse } from './project.types';

import request from '@/utils/request';

/**
 * 任务变更日志内容项。
 */
export interface ProjectTaskChangeItem {
  /**
   * 字段编码。
   */
  field: string;

  /**
   * 字段名称。
   */
  label: string;

  /**
   * 变更前展示值。
   */
  beforeValue: string;

  /**
   * 变更后展示值。
   */
  afterValue: string;
}

/**
 * 任务变更日志列表项。
 */
export interface ProjectTaskChangeLogItem {
  /**
   * 日志 ID。
   */
  id: number;

  /**
   * 任务 ID。
   */
  taskId: number;

  /**
   * 操作类型。
   */
  operationType: string;

  /**
   * 操作文案。
   */
  operationText: string;

  /**
   * 操作人 ID。
   */
  operatorId: number;

  /**
   * 操作人名称。
   */
  operatorName: string;

  /**
   * 创建时间。
   */
  createdAt: string;

  /**
   * 变更内容。
   */
  changes: ProjectTaskChangeItem[];
}

/**
 * 任务变更日志列表查询参数。
 */
export interface ProjectTaskChangeLogListParams {
  /**
   * 任务 ID。
   */
  taskId: number;

  /**
   * 当前页码。
   */
  current?: number;

  /**
   * 每页条数。
   */
  pageSize?: number;
}

/**
 * 获取任务变更日志列表。
 */
export const getList = (params: ProjectTaskChangeLogListParams) => {
  return request<PageResponse<ProjectTaskChangeLogItem>>(
    '/project/task/change-log/list',
    {
      method: 'get',
      params,
    },
  );
};
