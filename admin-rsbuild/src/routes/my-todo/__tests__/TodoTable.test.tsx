import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ApiProjectTaskStatus } from '@/api';
import type { TodoItem } from '@/api/modules/todo.types';
import TodoTable from '../#TodoTable';
import { openTaskModal } from '@/service/taskModalService.tsx';

const {
  mockDrawer,
  mockModal,
  mockTodoItem,
  mockStatusConfigs,
  mockCurrentInfo,
} = vi.hoisted(() => {
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
    mockStatusConfigs: [
      { code: 'todo', name: '待处理', sort: 1, isCompleted: false },
      { code: 'inProgress', name: '进行中', sort: 2, isCompleted: false },
    ],
    mockCurrentInfo: {
      userId: 9527,
    },
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

  const MockKTable: any = (props: any) => {
    let rowProps: Record<string, any> = {};

    if (props.onRow) {
      rowProps = props.onRow(mockTodoItem);
    }

    return (
      <div>
        <div>{props.toolbar}</div>
        <button onClick={rowProps.onClick} type={'button'}>
          触发行点击
        </button>
      </div>
    );
  };

  MockKTable.Button = (props: any) => {
    return (
      <button type={'button'} onClick={props.onClick}>
        {props.children}
      </button>
    );
  };

  return {
    ...actual,
    KTable: MockKTable,
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

vi.mock('@/store/auth.ts', () => {
  return {
    __esModule: true,
    default: (selector: (state: { currentInfo: { userId: number } }) => any) => {
      return selector({
        currentInfo: mockCurrentInfo,
      });
    },
  };
});

vi.mock('@/api', () => {
  return {
    ApiProjectTaskStatus: {
      getList: vi.fn(),
    },
  };
});

const mockedOpenTaskModal = vi.mocked(openTaskModal);
const mockedGetTaskStatusList = vi.mocked(ApiProjectTaskStatus.getList);

describe('TodoTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetTaskStatusList.mockResolvedValue(mockStatusConfigs as any);
  });

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
        title: '任务详情',
      }),
    );
  });

  it('点击新建任务会打开任务弹窗并默认指派给当前用户', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    mockedOpenTaskModal.mockResolvedValue(true);

    render(
      <QueryClientProvider client={queryClient}>
        <TodoTable />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: '新建任务' }));

    await waitFor(() => {
      expect(mockedOpenTaskModal).toHaveBeenCalledTimes(1);
    });

    expect(mockedOpenTaskModal).toHaveBeenCalledWith(
      mockModal,
      expect.objectContaining({
        statusConfigs: mockStatusConfigs,
        defaultAssigneeId: mockCurrentInfo.userId,
      }),
    );
  });
});
