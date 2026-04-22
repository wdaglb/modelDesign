import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DailyReportTextCard from '../#DailyReportTextCard';

describe('DailyReportTextCard', () => {
  it('点击一键复制时调用复制函数并传入指定文本', async () => {
    const user = userEvent.setup();
    const copyText = vi.fn().mockResolvedValue(undefined);

    render(
      <DailyReportTextCard
        report={{
          reportType: 'daily',
          reportTitle: '日报（2026-04-23）',
          periodStart: '2026-04-23 00:00:00',
          periodEnd: '2026-04-23 23:59:59',
          tasks: [
            {
              id: 101,
              title: '补前端报表页',
              participationRole: '负责人',
              status: 'inProgress',
              priority: 'high',
              updatedAt: '2026-04-23 10:00:00',
              projectName: '演示项目',
              latestDynamicSummary: '已联调接口',
            },
          ],
          dynamics: [],
        }}
        copyText={copyText}
      />,
    );

    await user.click(screen.getByRole('button', { name: '一键复制' }));

    expect(copyText).toHaveBeenCalledTimes(1);
    expect(copyText).toHaveBeenCalledWith(
      '一、演示项目\n  1. 补前端报表页（进行中，已联调接口）',
    );
  });
});
