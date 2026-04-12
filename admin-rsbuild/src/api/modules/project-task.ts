import request from '@/utils/request';

import type {
  ProjectTaskBoardParams,
  ProjectTaskBoardResponse,
  ProjectTaskChildrenResponse,
  ProjectTaskChildrenBatchResponse,
  CreateProjectTaskParams,
  EditProjectTaskParams,
  ProjectTaskDetail,
  ProjectTaskDetailByCodeResponse,
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
 * 获取敏捷面板任务列表。
 */
export const getBoard = (
  params?: ProjectTaskBoardParams,
): Promise<ProjectTaskBoardResponse> => {
  return request('/project/task/board', {
    method: 'get',
    params,
  });
};

/**
 * 获取敏捷面板专用任务列表。
 */
export const getAgileBoard = (
  params?: ProjectTaskBoardParams,
): Promise<ProjectTaskBoardResponse> => {
  return request('/project/task/agile-board', {
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
 * 按编号获取项目任务详情。
 *
 * 编号字段兼容 taskNo、taskCode、code 与 serialNumber。
 */
export const getDetailByCode = (
  code: string,
): Promise<ProjectTaskDetailByCodeResponse> => {
  return request('/project/task/detail/by-code', {
    method: 'get',
    params: { code },
  });
};

/**
 * 获取子任务列表。
 */
export const getChildren = (
  parentTaskId: number,
): Promise<ProjectTaskChildrenResponse> => {
  return request('/project/task/children', {
    method: 'get',
    params: { parentTaskId },
  });
};

/**
 * 批量获取子任务列表。
 */
export const getChildrenBatch = (
  parentTaskIds: number[],
): Promise<ProjectTaskChildrenBatchResponse> => {
  return request('/project/task/children/batch', {
    method: 'get',
    params: { parentTaskIds },
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
