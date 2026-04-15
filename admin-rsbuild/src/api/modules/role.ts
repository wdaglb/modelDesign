import request from '@/utils/request';
import { List } from '@/components/KTable/types.ts';

/**
 * 角色信息。
 */
export interface Role {
  /**
   * 角色 ID。
   */
  id: number;

  /**
   * 角色名称。
   */
  name: string;

  /**
   * 角色编码。
   */
  code: string;

  /**
   * 角色备注。
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
 * 角色分页查询参数。
 */
export interface RolePageParams {
  /**
   * 当前页码。
   */
  current?: number;

  /**
   * 每页条数。
   */
  pageSize?: number;

  /**
   * 按角色 ID 集合筛选。
   */
  ids?: number[];

  /**
   * 按角色名称关键字筛选。
   */
  name?: string;

  /**
   * 按角色编码关键字筛选。
   */
  code?: string;
}

/**
 * 新增角色请求参数。
 */
export interface RoleCreateParams {
  /**
   * 角色名称。
   */
  name: string;

  /**
   * 角色编码。
   */
  code: string;

  /**
   * 角色备注。
   */
  remark?: string;

  /**
   * 排序值。
   */
  sort: number;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 编辑角色请求参数。
 */
export interface RoleUpdateParams {
  /**
   * 角色名称。
   */
  name: string;

  /**
   * 角色编码。
   */
  code: string;

  /**
   * 角色备注。
   */
  remark?: string;

  /**
   * 排序值。
   */
  sort: number;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 单个角色状态修改参数。
 */
export interface RoleUpdateStatusParams {
  /**
   * 角色 ID。
   */
  id: number;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 批量角色状态修改参数。
 */
export interface RoleBatchUpdateStatusParams {
  /**
   * 角色 ID 列表。
   */
  ids: number[];

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 获取角色分页列表。
 */
export const getPageList = (params?: RolePageParams) => {
  return request<List<Role>>('/role/list', {
    params,
  });
};

/**
 * 新增角色。
 */
export const add = (data: RoleCreateParams) => {
  return request<Role>('/role/add', {
    method: 'post',
    data,
  });
};

/**
 * 编辑角色。
 */
export const update = (id: number, data: RoleUpdateParams) => {
  return request<Role>('/role/update', {
    method: 'post',
    params: { id },
    data,
  });
};

/**
 * 修改单个角色状态。
 */
export const updateStatus = (data: RoleUpdateStatusParams) => {
  return request('/role/update_status', {
    method: 'post',
    data,
  });
};

/**
 * 批量修改角色状态。
 */
export const batchUpdateStatus = (data: RoleBatchUpdateStatusParams) => {
  return request('/role/batch_update_status', {
    method: 'post',
    data,
  });
};

/**
 * 角色权限信息。
 */
export interface RolePermissionVo {
  /**
   * 直接绑定的菜单资源列表。
   */
  menuResources: string[];

  /**
   * 直接绑定的接口资源列表。
   */
  apiResources: string[];

  /**
   * 直接绑定的资源组编码列表。
   */
  resourceGroupCodes: string[];
}

/**
 * 查询角色权限配置。
 */
export const getPermission = (roleCode: string) => {
  return request<RolePermissionVo>('/role/permission', {
    params: { roleCode },
  });
};

/**
 * 更新角色权限配置。
 */
export const updatePermission = (
  roleCode: string,
  data: {
    menuResources: string[];
    apiResources: string[];
    resourceGroupCodes: string[];
  },
) => {
  return request('/role/permission/update', {
    method: 'post',
    params: { roleCode },
    data,
  });
};

/**
 * 获取角色已绑定的用户 ID 列表。
 */
export const getRoleUsers = (roleCode: string) => {
  return request<number[]>('/role/users', {
    params: { roleCode },
  });
};

/**
 * 更新角色绑定用户。
 *
 * 传空数组则清空所有绑定。
 */
export const updateRoleUsers = (roleCode: string, userIds: number[]) => {
  return request('/role/users/update', {
    method: 'post',
    params: { roleCode },
    data: { userIds },
  });
};
