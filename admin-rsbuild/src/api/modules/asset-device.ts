import axios from 'axios';

import useAuthStore from '@/store/auth';
import request from '@/utils/request';

/**
 * 设备库存导入模板下载地址。
 */
export const IMPORT_TEMPLATE_DOWNLOAD_URL = '/api/asset/device/import/template';

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
 * 设备批量入库结果。
 */
export interface AssetDeviceImportResult {
  /**
   * 成功导入数量。
   */
  importedCount: number;
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
 * 批量导入设备库存。
 */
export const importDevices = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return request<AssetDeviceImportResult>('/asset/device/import', {
    method: 'post',
    data: formData,
  });
};

/**
 * 下载设备库存导入模板。
 */
export const downloadImportTemplate = async () => {
  const token =
    useAuthStore.getState().token || localStorage.getItem('token') || '';
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = token;
  }

  const response = await axios.get('/api/asset/device/import/template', {
    responseType: 'blob',
    headers,
  });
  downloadBlob(response.data, resolveImportTemplateFileName(response.headers));
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

/**
 * 从模板下载响应头中解析文件名。
 *
 * @param headers HTTP 响应头
 * @returns 下载文件名
 */
function resolveImportTemplateFileName(headers: Record<string, unknown>) {
  const contentDisposition = String(headers['content-disposition'] || '');
  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch && encodedMatch[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (plainMatch && plainMatch[1]) {
    return plainMatch[1];
  }

  return '设备库存导入模板.xlsx';
}

/**
 * 触发浏览器下载。
 *
 * @param blob 文件内容
 * @param fileName 文件名
 */
function downloadBlob(blob: Blob, fileName: string) {
  const downloadUrl = URL.createObjectURL(blob);
  const linkElement = document.createElement('a');
  linkElement.href = downloadUrl;
  linkElement.download = fileName;
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
  URL.revokeObjectURL(downloadUrl);
}
