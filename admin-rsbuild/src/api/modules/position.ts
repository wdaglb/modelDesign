import request from '@/utils/request';
import { List } from '@/components/KTable/types.ts';

/**
 * 职位信息。
 */
export interface Position {
  /**
   * 职位 ID。
   */
  id: number;

  /**
   * 所属租户 ID。
   */
  tenantId: number;

  /**
   * 所属租户名称。
   */
  tenantName?: string;

  /**
   * 职位名称。
   */
  name: string;

  /**
   * 职位编码。
   */
  code: string;

  /**
   * 职位备注。
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
 * 职位分页查询参数。
 */
export interface PositionPageParams {
  /**
   * 当前页码。
   */
  current?: number;

  /**
   * 每页条数。
   */
  pageSize?: number;

  /**
   * 职位名称关键字。
   */
  name?: string;

  /**
   * 职位编码关键字。
   */
  code?: string;

  /**
   * 所属租户 ID。
   */
  tenantId?: number;

  /**
   * 是否禁用。
   */
  isDisable?: boolean;
}

/**
 * 新增职位请求参数。
 */
export interface PositionCreateParams {
  /**
   * 所属租户 ID。
   */
  tenantId: number;

  /**
   * 职位名称。
   */
  name: string;

  /**
   * 职位编码。
   */
  code: string;

  /**
   * 排序值。
   */
  sort: number;

  /**
   * 职位备注。
   */
  remark?: string;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 编辑职位请求参数。
 */
export interface PositionUpdateParams {
  /**
   * 所属租户 ID。
   */
  tenantId: number;

  /**
   * 职位名称。
   */
  name: string;

  /**
   * 职位编码。
   */
  code: string;

  /**
   * 排序值。
   */
  sort: number;

  /**
   * 职位备注。
   */
  remark?: string;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 单个职位状态修改参数。
 */
export interface PositionUpdateStatusParams {
  /**
   * 职位 ID。
   */
  id: number;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 批量职位状态修改参数。
 */
export interface PositionBatchUpdateStatusParams {
  /**
   * 职位 ID 列表。
   */
  ids: number[];

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 获取职位分页列表。
 */
export const getPageList = (params?: PositionPageParams) => {
  return request<List<Position>>('/position/list', {
    params,
  });
};

/**
 * 新增职位。
 */
export const add = (data: PositionCreateParams) => {
  return request<Position>('/position/add', {
    method: 'post',
    data,
  });
};

/**
 * 编辑职位。
 */
export const update = (id: number, data: PositionUpdateParams) => {
  return request<Position>('/position/update', {
    method: 'post',
    params: { id },
    data,
  });
};

/**
 * 修改单个职位状态。
 */
export const updateStatus = (data: PositionUpdateStatusParams) => {
  return request('/position/update_status', {
    method: 'post',
    data,
  });
};

/**
 * 批量修改职位状态。
 */
export const batchUpdateStatus = (data: PositionBatchUpdateStatusParams) => {
  return request('/position/batch_update_status', {
    method: 'post',
    data,
  });
};

/**
 * 删除职位。
 */
export const deletePosition = (id: number) => {
  return request('/position/delete', {
    method: 'post',
    data: { id },
  });
};
