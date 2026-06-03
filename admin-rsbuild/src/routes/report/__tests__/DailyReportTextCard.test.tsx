import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import DailyReportTextCard from '../#DailyReportTextCard';

describe('DailyReportTextCard', () => {
  it('日报文本使用 Typography copyable 提供复制入口', () => {
    const { container } = render(
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
      />,
    );

    expect(screen.getByText(/一、演示项目/)).toBeDefined();
    expect(screen.getByText(/补前端报表页/)).toBeDefined();
    expect(container.querySelector('.ant-typography-copy')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '一键复制' })).toBeNull();
  });
});
