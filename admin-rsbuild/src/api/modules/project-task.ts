import request from '@/utils/request.ts';

import type {
  CreateProjectTaskParams,
  EditProjectTaskParams,
  ProjectTaskDetail,
  ProjectTaskListParams,
  ProjectTaskPageResponse,
} from './project-task.types';

/**
 * 获取项目任务列表。
 */
export const getList = (
  params: ProjectTaskListParams,
): Promise<ProjectTaskPageResponse> => {
  return request('/project/task/list', {
    method: 'get',
    params,
  });
};

/**
 * 获取项目任务详情。
 */
export const getDetail = (id: number): Promise<ProjectTaskDetail> => {
  return request('/project/task/detail', {
    method: 'get',
    params: { id },
  });
};

/**
 * 创建项目任务。
 */
export const create = (
  data: CreateProjectTaskParams,
): Promise<ProjectTaskDetail> => {
  return request('/project/task/create', {
    method: 'post',
    data,
  });
};

/**
 * 编辑项目任务。
 */
export const edit = (
  id: number,
  data: EditProjectTaskParams,
): Promise<ProjectTaskDetail> => {
  return request('/project/task/edit', {
    method: 'post',
    params: { id },
    data,
  });
};

/**
 * 删除项目任务。
 */
export const deleted = (ids: number[]) => {
  return request<number>('/project/task/deleted', {
    method: 'post',
    data: { ids },
  });
};
