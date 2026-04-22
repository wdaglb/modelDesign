import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApiProjectTaskReport } from '@/api';

import RouteComponent from '../index';

vi.mock('@/api', () => {
  return {
    ApiProjectTaskReport: {
      generate: vi.fn(),
    },
  };
});

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>(
      '@tanstack/react-router',
    );

  return {
    ...actual,
    createFileRoute: () => {
      return (options: Record<string, unknown>) => options;
    },
  };
});

const mockedGenerate = vi.mocked(ApiProjectTaskReport.generate);

describe('ReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGenerate.mockResolvedValue({
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
      dynamics: [
        {
          taskId: 101,
          taskTitle: '补前端报表页',
          projectName: '演示项目',
          operatorName: '张三',
          createdAt: '2026-04-23 09:30:00',
          content: '已联调接口',
        },
      ],
    });
  });

  it('点击生成报表后展示任务、动态和日报文本结果', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <RouteComponent />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: '生成报表' }));

    await waitFor(() => {
      expect(mockedGenerate).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('日报（2026-04-23）')).toBeDefined();
    expect(screen.getAllByText('补前端报表页')).toHaveLength(2);
    expect(screen.getByText('发布人：张三')).toBeDefined();
    expect(screen.getByText('最新动态：已联调接口')).toBeDefined();
    expect(
      screen.getAllByText((_, element) => {
        return (
          element?.textContent ===
          '一、演示项目\n  1. 补前端报表页（进行中，已联调接口）'
        );
      }).length,
    ).toBeGreaterThan(0);
  });
});
