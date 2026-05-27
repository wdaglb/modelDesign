import request from '@/utils/request';

/**
 * 任务迭代。
 */
export interface ProjectTaskIteration {
  /** 迭代 ID。 */
  id: number;
  /** 迭代名称。 */
  name: string;
  /** 开始日期。 */
  startDate: string;
  /** 结束日期。 */
  endDate: string;
  /** 是否已发布。 */
  published: boolean;
}

/**
 * 任务迭代列表查询参数。
 */
export interface ProjectTaskIterationListParams {
  /** 迭代名称关键字。 */
  name?: string;
}

/**
 * 创建任务迭代参数。
 */
export interface ProjectTaskIterationCreateParams {
  /** 迭代名称。 */
  name: string;
  /** 开始日期。 */
  startDate: string;
  /** 结束日期。 */
  endDate: string;
  /** 是否已发布。 */
  published: boolean;
}

/**
 * 编辑任务迭代参数。
 */
export type ProjectTaskIterationEditParams =
  ProjectTaskIterationCreateParams;

/**
 * 获取任务迭代列表。
 */
export const getList = (params?: ProjectTaskIterationListParams) => {
  return request<ProjectTaskIteration[]>('/project/task-iteration/list', {
    method: 'get',
    params,
  });
};

/**
 * 创建任务迭代。
 */
export const create = (data: ProjectTaskIterationCreateParams) => {
  return request<ProjectTaskIteration>('/project/task-iteration/create', {
    method: 'post',
    data,
  });
};

/**
 * 编辑任务迭代。
 */
export const edit = (
  id: number,
  data: ProjectTaskIterationEditParams,
) => {
  return request<ProjectTaskIteration>('/project/task-iteration/edit', {
    method: 'post',
    params: { id },
    data,
  });
};

/**
 * 删除任务迭代。
 */
export const deleted = (id: number) => {
  return request<number>('/project/task-iteration/deleted', {
    method: 'post',
    data: { id },
  });
};
