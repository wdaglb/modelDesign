import type { PageResponse } from './project.types';

import request from '@/utils/request';

/**
 * 任务动态列表项。
 */
export interface ProjectTaskDynamicItem {
  /**
   * 动态 ID。
   */
  id: number;

  /**
   * 任务 ID。
   */
  taskId: number;

  /**
   * 动态内容。
   */
  content: string;

  /**
   * 发布人 ID。
   */
  operatorId: number;

  /**
   * 发布人名称。
   */
  operatorName: string;

  /**
   * 创建时间。
   */
  createdAt: string;
}

/**
 * 任务动态列表查询参数。
 */
export interface ProjectTaskDynamicListParams {
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
 * 创建任务动态参数。
 */
export interface CreateProjectTaskDynamicParams {
  /**
   * 任务 ID。
   */
  taskId: number;

  /**
   * 动态内容。
   */
  content: string;

  /**
   * 被 @ 的用户 ID 集合。
   *
   * 当前仅用于发布动态时触发系统消息通知，不参与动态正文展示。
   */
  mentionedUserIds?: number[];
}

/**
 * 获取任务动态列表。
 */
export const getList = (params: ProjectTaskDynamicListParams) => {
  return request<PageResponse<ProjectTaskDynamicItem>>(
    '/project/task/dynamic/list',
    {
      method: 'get',
      params,
    },
  );
};

/**
 * 创建任务动态。
 */
export const create = (data: CreateProjectTaskDynamicParams) => {
  return request<ProjectTaskDynamicItem>('/project/task/dynamic/create', {
    method: 'post',
    data,
  });
};
