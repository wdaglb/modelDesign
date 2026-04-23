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
}

/**
 * 盘点结果项。
 */
export interface AssetStocktakeDetailItem {
  /**
   * 任务 ID。
   */
  taskId: number;

  /**
   * 设备 ID。
   */
  deviceId: number;

  /**
   * 结果状态。
   */
  resultStatus?: number;
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
