import request from '@/utils/request';

/**
 * 设备台账项。
 */
export interface AssetDeviceItem {
  /**
   * 设备 ID。
   */
  id: number;

  /**
   * 所属租户 ID。
   */
  tenantId: number;

  /**
   * 设备名称。
   */
  deviceName: string;

  /**
   * 设备分类 ID。
   */
  categoryId: number;

  /**
   * 资产编号。
   */
  assetCode: string;

  /**
   * 序列号。
   */
  serialNumber?: string;

  /**
   * 当前状态值。
   */
  status: number;

  /**
   * 位置 ID。
   */
  locationId?: number;

  /**
   * 当前使用人 ID。
   */
  currentUserId?: number;

  /**
   * 购置日期。
   */
  purchaseDate?: string;

  /**
   * 备注。
   */
  remark: string;
}

/**
 * 设备台账查询参数。
 */
export interface AssetDeviceListParams {
  /**
   * 当前页码。
   */
  current?: number;

  /**
   * 每页条数。
   */
  pageSize?: number;

  /**
   * 设备名称。
   */
  deviceName?: string;

  /**
   * 分类 ID。
   */
  categoryId?: number;

  /**
   * 资产编号。
   */
  assetCode?: string;

  /**
   * 序列号。
   */
  serialNumber?: string;

  /**
   * 状态。
   */
  status?: number;

  /**
   * 位置 ID。
   */
  locationId?: number;

  /**
   * 当前使用人 ID。
   */
  currentUserId?: number;
}

/**
 * 设备台账分页响应。
 */
export interface AssetDeviceListResponse {
  /**
   * 列表数据。
   */
  items: AssetDeviceItem[];

  /**
   * 总条数。
   */
  total: number;
}

/**
 * 资产下拉选项。
 */
export interface AssetOptionItem {
  /**
   * 选项值，当前资产模块统一使用业务 ID。
   */
  value: number;

  /**
   * 选项文本。
   */
  label: string;
}

/**
 * 设备入库登记请求体。
 */
export interface AssetDeviceCreateData {
  /**
   * 设备名称。
   */
  deviceName: string;

  /**
   * 分类 ID。
   */
  categoryId: number;

  /**
   * 资产编号。
   */
  assetCode: string;

  /**
   * 位置 ID。
   */
  locationId: number;

  /**
   * 序列号。
   */
  serialNumber?: string;

  /**
   * 购置日期，格式为 YYYY-MM-DD。
   */
  purchaseDate?: string;

  /**
   * 备注。
   */
  remark?: string;
}

/**
 * 获取设备台账列表。
 */
export const getList = (params?: AssetDeviceListParams) => {
  return request<AssetDeviceListResponse>('/asset/device/list', {
    method: 'get',
    params,
  });
};

/**
 * 获取设备分类下拉。
 */
export const getCategoryOptions = () => {
  return request<AssetOptionItem[]>('/asset/options/categories');
};

/**
 * 获取设备位置下拉。
 */
export const getLocationOptions = () => {
  return request<AssetOptionItem[]>('/asset/options/locations');
};

/**
 * 入库登记。
 */
export const create = (data: AssetDeviceCreateData) => {
  return request<AssetDeviceItem>('/asset/device/create', {
    method: 'post',
    data,
  });
};

/**
 * 编辑设备台账。
 */
export const edit = (id: number, data: Record<string, unknown>) => {
  return request<AssetDeviceItem>('/asset/device/edit', {
    method: 'post',
    params: { id },
    data,
  });
};

/**
 * 领用设备。
 */
export const receive = (data: Record<string, unknown>) => {
  return request<AssetDeviceItem>('/asset/device/receive', {
    method: 'post',
    data,
  });
};

/**
 * 归还设备。
 */
export const returned = (data: Record<string, unknown>) => {
  return request<AssetDeviceItem>('/asset/device/return', {
    method: 'post',
    data,
  });
};

/**
 * 调拨设备。
 */
export const transfer = (data: Record<string, unknown>) => {
  return request<AssetDeviceItem>('/asset/device/transfer', {
    method: 'post',
    data,
  });
};

/**
 * 报废设备。
 */
export const scrap = (data: Record<string, unknown>) => {
  return request<AssetDeviceItem>('/asset/device/scrap', {
    method: 'post',
    data,
  });
};
