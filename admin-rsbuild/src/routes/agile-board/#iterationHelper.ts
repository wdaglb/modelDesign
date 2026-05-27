import dayjs, { type Dayjs } from 'dayjs';

import type { ProjectTaskIteration } from '@/api/modules/project-task-iteration';

/**
 * 解析敏捷面板默认迭代。
 *
 * 规则：
 * - 优先选择包含 referenceDate 的当前迭代；
 * - 没有当前迭代时，选择与 referenceDate 距离最近的迭代；
 * - 一个迭代也没有时返回 undefined，由页面展示缺省页。
 *
 * @param iterations 迭代列表
 * @param referenceDate 参考日期，默认使用当天
 * @return 默认迭代
 */
export function resolveDefaultBoardIteration(
  iterations: ProjectTaskIteration[],
  referenceDate = dayjs(),
) {
  if (iterations.length === 0) {
    return undefined;
  }

  const referenceDay = referenceDate.startOf('day');

  const currentIteration = iterations.find((iteration) => {
    const startDate = dayjs(iteration.startDate).startOf('day');
    const endDate = dayjs(iteration.endDate).startOf('day');
    if (referenceDay.isBefore(startDate)) {
      return false;
    }
    if (referenceDay.isAfter(endDate)) {
      return false;
    }
    return true;
  });

  if (currentIteration) {
    return currentIteration;
  }

  const sortedIterations = [...iterations].sort((left, right) => {
    const leftDistance = getIterationDistance(left, referenceDay);
    const rightDistance = getIterationDistance(right, referenceDay);
    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }

    const leftStartDate = dayjs(left.startDate).valueOf();
    const rightStartDate = dayjs(right.startDate).valueOf();
    return rightStartDate - leftStartDate;
  });

  return sortedIterations[0];
}

/**
 * 计算迭代日期范围与参考日期之间的最小自然日距离。
 *
 * @param iteration 迭代
 * @param referenceDay 已规整到自然日开始的参考日期
 * @return 自然日距离
 */
function getIterationDistance(
  iteration: ProjectTaskIteration,
  referenceDay: Dayjs,
) {
  const startDate = dayjs(iteration.startDate).startOf('day');
  const endDate = dayjs(iteration.endDate).startOf('day');

  if (referenceDay.isBefore(startDate)) {
    return Math.abs(startDate.diff(referenceDay, 'day'));
  }

  if (referenceDay.isAfter(endDate)) {
    return Math.abs(referenceDay.diff(endDate, 'day'));
  }

  return 0;
}
