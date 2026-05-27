import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { buildDefaultTaskIterationName } from '../#taskIterationNameHelper';

describe('buildDefaultTaskIterationName', () => {
  it('应按参考日期生成当月第几周名称', () => {
    expect(
      buildDefaultTaskIterationName(dayjs('2026-05-14')),
    ).toBe('2026年5月第2周');
  });

  it('应在跨到第五周时继续累加周次', () => {
    expect(
      buildDefaultTaskIterationName(dayjs('2026-05-31')),
    ).toBe('2026年5月第5周');
  });

  it('应按所选开始日期所属月份计算周次', () => {
    expect(
      buildDefaultTaskIterationName(dayjs('2026-06-01')),
    ).toBe('2026年6月第1周');
  });
});
