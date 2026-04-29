import request from '@/utils/request';

/**
 * 任务类型。
 */
export interface ProjectTaskType {
  /**
   * 类型 ID。
   */
  id: number;

  /**
   * 类型名称。
   */
  name: string;

  /**
   * 排序值。
   */
  sort: number;

  /**
   * Git 分支前缀分组。
   */
  gitBranchPrefixGroup?: string;
}

/**
 * 任务类型列表查询参数。
 */
export interface ProjectTaskTypeListParams {
  /**
   * 类型名称关键字。
   */
  name?: string;
}

/**
 * 创建任务类型请求参数。
 */
export interface ProjectTaskTypeCreateParams {
  /**
   * 类型名称。
   */
  name: string;

  /**
   * 排序值。
   */
  sort: number;

  /**
   * Git 分支前缀分组。
   */
  gitBranchPrefixGroup?: string;
}

/**
 * 编辑任务类型请求参数。
 */
export interface ProjectTaskTypeEditParams {
  /**
   * 类型名称。
   */
  name: string;

  /**
   * 排序值。
   */
  sort: number;

  /**
   * Git 分支前缀分组。
   */
  gitBranchPrefixGroup?: string;
}

/**
 * 获取任务类型列表。
 */
export const getList = (params?: ProjectTaskTypeListParams) => {
  return request<ProjectTaskType[]>('/project/task-type/list', {
    method: 'get',
    params,
  });
};

/**
 * 创建任务类型。
 */
export const create = (data: ProjectTaskTypeCreateParams) => {
  return request<ProjectTaskType>('/project/task-type/create', {
    method: 'post',
    data,
  });
};

/**
 * 编辑任务类型。
 */
export const edit = (id: number, data: ProjectTaskTypeEditParams) => {
  return request<ProjectTaskType>('/project/task-type/edit', {
    method: 'post',
    params: { id },
    data,
  });
};

/**
 * 删除任务类型。
 */
export const deleted = (id: number) => {
  return request<number>('/project/task-type/deleted', {
    method: 'post',
    data: { id },
  });
};
