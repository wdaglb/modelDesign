import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { ProjectTaskIteration } from '@/api/modules/project-task-iteration';

import { resolveDefaultBoardIteration } from '../#iterationHelper';

const iterations: ProjectTaskIteration[] = [
  {
    id: 1,
    name: '历史迭代',
    startDate: '2026-04-01',
    endDate: '2026-04-10',
  },
  {
    id: 2,
    name: '当前迭代',
    startDate: '2026-05-01',
    endDate: '2026-05-15',
  },
  {
    id: 3,
    name: '未来迭代',
    startDate: '2026-06-01',
    endDate: '2026-06-15',
  },
];

describe('resolveDefaultBoardIteration', () => {
  it('优先选择包含参考日期的当前迭代', () => {
    const result = resolveDefaultBoardIteration(
      iterations,
      dayjs('2026-05-13'),
    );

    expect(result?.id).toBe(2);
  });

  it('没有当前迭代时选择离参考日期最近的迭代', () => {
    const result = resolveDefaultBoardIteration(
      iterations,
      dayjs('2026-05-25'),
    );

    expect(result?.id).toBe(3);
  });

  it('没有任何迭代时返回 undefined', () => {
    const result = resolveDefaultBoardIteration([], dayjs('2026-05-13'));

    expect(result).toBeUndefined();
  });
});
