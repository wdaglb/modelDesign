import dayjs, { type Dayjs } from 'dayjs';

/**
 * 生成任务迭代的默认名称。
 *
 * 默认名称需要兼顾“当月第几周”的可读性和名称唯一约束，
 * 因此前缀保留年份，避免跨年后出现相同月份周次的重名冲突。
 *
 * @param referenceDate 参考日期，默认使用当天
 * @return 默认迭代名称
 */
export function buildDefaultTaskIterationName(referenceDate = dayjs()) {
  const normalizedDate = referenceDate.startOf('day');
  const weekOfMonth =
    Math.floor((normalizedDate.date() - 1) / 7) + 1;

  return `${normalizedDate.year()}年${normalizedDate.month() + 1}月第${weekOfMonth}周`;
}
