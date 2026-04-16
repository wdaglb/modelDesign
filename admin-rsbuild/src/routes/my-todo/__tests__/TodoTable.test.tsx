import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { TodoItem } from '@/api/modules/todo.types';
import TodoTable from '../#TodoTable';

const { mockDrawer, mockModal, mockTodoItem } = vi.hoisted(() => {
  return {
    mockDrawer: {
      open: vi.fn(),
    },
    mockModal: {
      open: vi.fn(),
    },
    mockTodoItem: {
      id: 321,
      title: '修复我的待办点击行为',
      receivedAt: '2026-04-16 10:00:00',
      priority: 'high',
      status: 'todo',
      initiatorName: '测试用户',
      workDays: 1,
      projectId: 12,
      projectName: '演示项目',
    } as TodoItem,
  };
});

vi.mock('@/components/KDrawer', () => {
  return {
    useKDrawer: () => mockDrawer,
  };
});

vi.mock('@/components/KModal', () => {
  return {
    useKModal: () => mockModal,
  };
});

vi.mock('@/components', async () => {
  const actual = await vi.importActual<typeof import('@/components')>(
    '@/components',
  );

  return {
    ...actual,
    KTable: (props: any) => {
      let rowProps: Record<string, any> = {};

      if (props.onRow) {
        rowProps = props.onRow(mockTodoItem);
      }

      return (
        <button onClick={rowProps.onClick} type={'button'}>
          触发行点击
        </button>
      );
    },
  };
});

vi.mock('@/hooks/useAutoRefresh', () => {
  return {
    default: vi.fn(),
  };
});

vi.mock('@/service/taskModalService.tsx', () => {
  return {
    openTaskModal: vi.fn(),
  };
});

describe('TodoTable', () => {
  it('点击表格行时打开任务详情抽屉', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TodoTable />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: '触发行点击' }));

    await waitFor(() => {
      expect(mockDrawer.open).toHaveBeenCalledTimes(1);
    });

    expect(mockDrawer.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '任务预览',
      }),
    );
  });
});
