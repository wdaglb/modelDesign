import axios from 'axios';

import useAuthStore from '@/store/auth.ts';
import request from '@/utils/request';

/**
 * 盘点任务项。
 */
export interface AssetStocktakeTaskItem {
  /**
   * 任务 ID。
   */
  id: number;

  /**
   * 任务名称。
   */
  name: string;

  /**
   * 状态值。
   */
  status: number;

  /**
   * 范围类型。
   */
  scopeType?: number;

  /**
   * 范围位置 ID。
   */
  scopeLocationId?: number;

  /**
   * 开始时间。
   */
  startedAt?: string;

  /**
   * 完成时间。
   */
  finishedAt?: string;

  /**
   * 任务备注。
   */
  remark?: string;

  /**
   * 盘点明细总数。
   */
  totalCount?: number;

  /**
   * 已登记盘点结果数量。
   */
  checkedCount?: number;

  /**
   * 盘到数量。
   */
  foundCount?: number;

  /**
   * 未找到数量。
   */
  missingCount?: number;
}

/**
 * 盘点结果项。
 */
export interface AssetStocktakeDetailItem {
  /**
   * 明细 ID。
   */
  id: number;

  /**
   * 任务 ID。
   */
  taskId: number;

  /**
   * 设备 ID。
   */
  deviceId: number;

  /**
   * 设备名称。
   */
  deviceName?: string;

  /**
   * 资产编号。
   */
  assetCode?: string;

  /**
   * 设备状态。
   */
  deviceStatus?: number;

  /**
   * 账面数量。
   */
  expectedQuantity?: number;

  /**
   * 实际数量。
   */
  actualQuantity?: number;

  /**
   * 差异数量。
   */
  differenceQuantity?: number;

  /**
   * 账面位置 ID。
   */
  expectedLocationId?: number;

  /**
   * 账面使用人 ID。
   */
  expectedUserId?: number;

  /**
   * 结果状态。
   */
  resultStatus?: number;

  /**
   * 实际位置 ID。
   */
  actualLocationId?: number;

  /**
   * 实际使用人 ID。
   */
  actualUserId?: number;

  /**
   * 盘点人 ID。
   */
  checkedUserId?: number;

  /**
   * 盘点时间。
   */
  checkedAt?: string;

  /**
   * 备注。
   */
  remark?: string;
}

/**
 * 获取盘点任务列表。
 */
export const getList = () => {
  return request<AssetStocktakeTaskItem[]>('/asset/stocktake/list', {
    method: 'get',
  });
};

/**
 * 获取盘点任务明细。
 */
export const getDetail = (id: number) => {
  return request<AssetStocktakeDetailItem[]>('/asset/stocktake/detail', {
    method: 'get',
    params: { id },
  });
};

/**
 * 创建盘点任务。
 */
export const create = (data: Record<string, unknown>) => {
  return request<AssetStocktakeTaskItem>('/asset/stocktake/create', {
    method: 'post',
    data,
  });
};

/**
 * 提交盘点结果。
 */
export const check = (data: Record<string, unknown>) => {
  return request<AssetStocktakeDetailItem>('/asset/stocktake/check', {
    method: 'post',
    data,
  });
};

/**
 * 完成盘点任务。
 */
export const complete = (id: number) => {
  return request<AssetStocktakeTaskItem>('/asset/stocktake/complete', {
    method: 'post',
    params: { id },
  });
};

/**
 * 解析导出响应中的文件名。
 *
 * @param contentDisposition 响应头
 * @param fallbackName 兜底文件名
 * @returns 文件名
 */
function resolveFileName(contentDisposition?: string, fallbackName?: string) {
  if (!contentDisposition) {
    return `${fallbackName || '盘点任务'}-盘点结果.xlsx`;
  }
  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch && encodedMatch[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }
  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (plainMatch && plainMatch[1]) {
    return plainMatch[1];
  }
  return `${fallbackName || '盘点任务'}-盘点结果.xlsx`;
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

/**
 * 导出盘点结果。
 */
export const exportDetail = async (id: number, taskName?: string) => {
  const token =
    useAuthStore.getState().token || localStorage.getItem('token') || '';
  const response = await axios.get('/api/asset/stocktake/export', {
    params: { id },
    responseType: 'blob',
    headers: token
      ? {
          Authorization: token,
        }
      : undefined,
  });
  downloadBlob(
    response.data,
    resolveFileName(response.headers['content-disposition'], taskName),
  );
};
