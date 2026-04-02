import request from '@/utils/request.ts';
import {
  Project,
  CreateProjectParams,
  EditProjectParams,
  ProjectListParams,
  ProjectListResponse,
} from './project.types';

/**
 * 获取项目列表。
 *
 * @param params 列表查询参数
 * @returns 项目列表响应
 */
export const getList = (params?: ProjectListParams) => {
  return request<ProjectListResponse>('/project/list', { params });
};

/**
 * 获取项目详情
 * @param id
 * @returns
 */
export const getDetail = (id: number) => {
  return request<Project>('/project/detail', {
    params: { id },
  });
};

/**
 * 创建项目
 * @param data
 * @returns
 */
export const create = (data: CreateProjectParams) => {
  return request<Project>('/project/create', {
    method: 'post',
    data,
  });
};

/**
 * 修改项目信息
 * @param id
 * @param data
 * @returns
 */
export const edit = (id: number, data: EditProjectParams) => {
  return request<Project>('/project/edit', {
    method: 'post',
    params: { id },
    data,
  });
};

/**
 * 删除项目
 * @param ids
 * @returns
 */
export const deleted = (ids: number[]) => {
  return request('/project/deleted', {
    method: 'post',
    data: { ids },
  });
};
