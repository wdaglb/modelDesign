import request from '@/utils/request';
import {
  Project,
  CreateProjectParams,
  EditProjectParams,
  ProjectListParams,
  ProjectListResponse,
} from './project.types';

/**
 * 项目接口请求选项。
 */
interface ProjectRequestOptions {
  /**
   * 是否跳过统一错误提示。
   */
  skipErrorHandler?: boolean;
}

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
 * @param data 创建项目参数
 * @param options 请求控制选项
 * @returns
 */
export const create = (
  data: CreateProjectParams,
  options?: ProjectRequestOptions,
) => {
  return request<Project>('/project/create', {
    method: 'post',
    data,
    skipErrorHandler: options?.skipErrorHandler,
  });
};

/**
 * 修改项目信息
 * @param id 项目 ID
 * @param data 编辑项目参数
 * @param options 请求控制选项
 * @returns
 */
export const edit = (
  id: number,
  data: EditProjectParams,
  options?: ProjectRequestOptions,
) => {
  return request<Project>('/project/edit', {
    method: 'post',
    params: { id },
    data,
    skipErrorHandler: options?.skipErrorHandler,
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
