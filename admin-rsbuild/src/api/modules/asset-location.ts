import request from '@/utils/request';

/**
 * 设备位置项。
 */
export interface AssetLocationItem {
  /**
   * 位置 ID。
   */
  id: number;

  /**
   * 所属租户 ID。
   */
  tenantId: number;

  /**
   * 位置名称。
   */
  name: string;

  /**
   * 位置编码。
   */
  code: string;

  /**
   * 父级位置 ID。
   */
  parentId: number;
}

/**
 * 获取位置列表。
 */
export const getList = () => {
  return request<AssetLocationItem[]>('/asset/location/list', {
    method: 'get',
  });
};

/**
 * 新建设备位置。
 */
export const create = (data: Record<string, unknown>) => {
  return request<AssetLocationItem>('/asset/location/create', {
    method: 'post',
    data,
  });
};

/**
 * 编辑设备位置。
 */
export const edit = (id: number, data: Record<string, unknown>) => {
  return request<AssetLocationItem>('/asset/location/edit', {
    method: 'post',
    params: { id },
    data,
  });
};
