import request from '@/utils/request.ts';
import { List } from '@/components/KTable/types.ts';

/**
 * 权限资源组。
 */
export interface PermissionGroup {
  /**
   * 资源组 ID。
   */
  id: number;

  /**
   * 资源组名称。
   */
  name: string;

  /**
   * 资源组编码。
   */
  code: string;

  /**
   * 备注。
   */
  remark?: string;

  /**
   * 排序值。
   */
  sort: number;

  /**
   * 是否禁用。
   */
  isDisable?: boolean;
}

/**
 * 资源组分页参数。
 */
export interface PermissionGroupPageParams {
  current?: number;
  pageSize?: number;
  name?: string;
  code?: string;
}

/**
 * 资源组保存参数。
 */
export interface PermissionGroupSaveParams {
  name: string;
  code: string;
  remark?: string;
  sort: number;
  isDisable: boolean;
}

/**
 * 资源组状态参数。
 */
export interface PermissionGroupUpdateStatusParams {
  id: number;
  isDisable: boolean;
}

/**
 * 资源组资源信息。
 */
export interface PermissionGroupResourceVo {
  groupCode: string;
  resources: string[];
}

/**
 * 获取资源组列表。
 */
export const getPageList = (params?: PermissionGroupPageParams) => {
  return request<List<PermissionGroup>>('/permission-group/list', {
    params,
  });
};

/**
 * 新增资源组。
 */
export const add = (data: PermissionGroupSaveParams) => {
  return request<PermissionGroup>('/permission-group/add', {
    method: 'post',
    data,
  });
};

/**
 * 编辑资源组。
 */
export const update = (id: number, data: PermissionGroupSaveParams) => {
  return request<PermissionGroup>('/permission-group/update', {
    method: 'post',
    params: { id },
    data,
  });
};

/**
 * 更新资源组状态。
 */
export const updateStatus = (data: PermissionGroupUpdateStatusParams) => {
  return request('/permission-group/update_status', {
    method: 'post',
    data,
  });
};

/**
 * 获取资源组资源列表。
 */
export const getResources = (groupCode: string) => {
  return request<PermissionGroupResourceVo>('/permission-group/resources', {
    params: { groupCode },
  });
};

/**
 * 更新资源组资源列表。
 */
export const updateResources = (groupCode: string, resources: string[]) => {
  return request('/permission-group/resources/update', {
    method: 'post',
    params: { groupCode },
    data: { resources },
  });
};
