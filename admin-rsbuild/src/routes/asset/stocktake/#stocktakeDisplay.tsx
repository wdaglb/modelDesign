import { Tag } from 'antd';

/**
 * 盘点结果枚举。
 */
export const STOCKTAKE_RESULT = {
  found: 1,
  missing: 2,
};

/**
 * 盘点任务状态枚举。
 */
export const STOCKTAKE_TASK_STATUS = {
  processing: 1,
  finished: 2,
};

/**
 * 获取盘点任务状态标签。
 *
 * @param status 状态值
 * @returns 状态标签
 */
export function getTaskStatusTag(status: number) {
  if (status === STOCKTAKE_TASK_STATUS.finished) {
    return <Tag color={'green'}>已完成</Tag>;
  }

  return <Tag color={'blue'}>进行中</Tag>;
}

/**
 * 获取盘点明细结果标签。
 *
 * @param resultStatus 结果状态值
 * @returns 结果标签
 */
export function getResultStatusTag(resultStatus?: number) {
  if (resultStatus === STOCKTAKE_RESULT.found) {
    return <Tag color={'green'}>盘到</Tag>;
  }

  if (resultStatus === STOCKTAKE_RESULT.missing) {
    return <Tag color={'red'}>未找到</Tag>;
  }

  return <Tag>待盘点</Tag>;
}

/**
 * 获取数字展示文本。
 *
 * @param value 数字值
 * @returns 展示文本
 */
export function getNumberText(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }

  return String(value);
}

/**
 * 获取数量差异展示。
 *
 * @param value 差异数量
 * @returns 差异展示
 */
export function getDifferenceText(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }

  if (value > 0) {
    return <Tag color={'gold'}>{`+${value}`}</Tag>;
  }

  if (value < 0) {
    return <Tag color={'red'}>{value}</Tag>;
  }

  return <Tag color={'green'}>0</Tag>;
}
