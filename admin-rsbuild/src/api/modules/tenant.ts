import request from '@/utils/request.ts';
import { List } from '@/components/KTable/types.ts';

/**
 * 租户信息。
 */
export interface Tenant {
  /**
   * 租户 ID。
   */
  id: number;

  /**
   * 租户编码。
   */
  code: string;

  /**
   * 租户名称。
   */
  name: string;

  /**
   * 租户描述。
   */
  description?: string;

  /**
   * 是否禁用。
   */
  isDisable?: boolean;

  /**
   * 创建时间。
   */
  createdAt?: string;

  /**
   * 更新时间。
   */
  updatedAt?: string;
}

/**
 * 租户下拉选项。
 */
export interface TenantOption {
  /**
   * 租户 ID。
   */
  id: number;

  /**
   * 租户编码。
   */
  code: string;

  /**
   * 租户名称。
   */
  name: string;
}

/**
 * 租户分页查询参数。
 */
export interface TenantPageParams {
  /**
   * 当前页码。
   */
  current?: number;

  /**
   * 每页条数。
   */
  pageSize?: number;

  /**
   * 租户编码关键字。
   */
  code?: string;

  /**
   * 租户名称关键字。
   */
  name?: string;

  /**
   * 是否禁用。
   */
  isDisable?: boolean;
}

/**
 * 新增租户请求参数。
 */
export interface TenantCreateParams {
  /**
   * 租户编码。
   */
  code: string;

  /**
   * 租户名称。
   */
  name: string;

  /**
   * 租户描述。
   */
  description?: string;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 编辑租户请求参数。
 */
export interface TenantUpdateParams {
  /**
   * 租户编码。
   */
  code: string;

  /**
   * 租户名称。
   */
  name: string;

  /**
   * 租户描述。
   */
  description?: string;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 单个租户状态修改参数。
 */
export interface TenantUpdateStatusParams {
  /**
   * 租户 ID。
   */
  id: number;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 获取租户分页列表。
 */
export const getPageList = (params?: TenantPageParams) => {
  return request<List<Tenant>>('/tenant/list', {
    params,
  });
};

/**
 * 新增租户。
 */
export const add = (data: TenantCreateParams) => {
  return request<Tenant>('/tenant/add', {
    method: 'post',
    data,
  });
};

/**
 * 编辑租户。
 */
export const update = (id: number, data: TenantUpdateParams) => {
  return request<Tenant>('/tenant/update', {
    method: 'post',
    params: { id },
    data,
  });
};

/**
 * 修改单个租户状态。
 */
export const updateStatus = (data: TenantUpdateStatusParams) => {
  return request('/tenant/update_status', {
    method: 'post',
    data,
  });
};

/**
 * 删除租户。
 */
export const deleteTenant = (id: number) => {
  return request('/tenant/delete', {
    method: 'post',
    data: { id },
  });
};

/**
 * 获取可选租户列表。
 */
export const getOptions = () => {
  return request<TenantOption[]>('/tenant/options');
};
