import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { ApiProjectTask } from '@/api';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';

import TaskSubtaskPanel from '../#TaskSubtaskPanel';

vi.mock('@/api', () => {
  return {
    ApiProjectTask: {
      create: vi.fn(),
      getChildren: vi.fn(),
      getDetail: vi.fn(),
    },
  };
});

const parentTask: ProjectTaskDetail = {
  id: 1001,
  projectId: 88,
  title: '父任务',
  status: 'inProgress',
  priority: 'high',
  assigneeId: 303,
};

const statusConfigs: TaskStatusConfig[] = [
  { code: 'doing', name: '处理中', sort: 10, isCompleted: false },
  { code: 'todo', name: '待处理', sort: 1, isCompleted: false },
  { code: 'done', name: '已完成', sort: 20, isCompleted: true },
];

describe('TaskSubtaskPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ApiProjectTask.getChildren).mockResolvedValue([]);
  });

  it('快捷创建会提交 parentTaskId / assigneeId / priority', async () => {
    const user = userEvent.setup();
    vi.mocked(ApiProjectTask.create).mockResolvedValue({
      ...parentTask,
      id: 1002,
      parentTaskId: parentTask.id,
      title: '子任务 A',
      status: 'todo',
    });

    renderWithQuery(
      <TaskSubtaskPanel
        parentTask={parentTask}
        statusConfigs={statusConfigs}
        onRefresh={vi.fn()}
        onEditTask={vi.fn()}
      />,
    );

    await user.type(
      screen.getByPlaceholderText('输入子任务标题后回车创建'),
      '子任务 A',
    );
    await user.click(screen.getByRole('button', { name: /添\s*加/ }));

    await waitFor(() => {
      expect(ApiProjectTask.create).toHaveBeenCalledTimes(1);
    });

    expect(ApiProjectTask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: parentTask.projectId,
        parentTaskId: parentTask.id,
        assigneeId: parentTask.assigneeId,
        priority: parentTask.priority,
        status: 'todo',
        title: '子任务 A',
      }),
    );
  });

  it('创建成功后清空输入并调用刷新回调', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    vi.mocked(ApiProjectTask.create).mockResolvedValue({
      ...parentTask,
      id: 1003,
      parentTaskId: parentTask.id,
      title: '子任务 B',
      status: 'todo',
    });

    renderWithQuery(
      <TaskSubtaskPanel
        parentTask={parentTask}
        statusConfigs={statusConfigs}
        onRefresh={onRefresh}
        onEditTask={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText('输入子任务标题后回车创建');
    await user.type(input, '子任务 B');
    await user.click(screen.getByRole('button', { name: /添\s*加/ }));

    await waitFor(() => {
      expect(ApiProjectTask.create).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('');
    });
  });

  it('点击补充详情会请求详情并调用编辑回调', async () => {
    const user = userEvent.setup();
    const onEditTask = vi.fn().mockResolvedValue(undefined);
    const childTask: ProjectTaskDetail = {
      ...parentTask,
      id: 2001,
      parentTaskId: parentTask.id,
      title: '子任务 C',
      status: 'doing',
      assignee: '小王',
      updatedAt: '2026-04-04 12:00:00',
    };
    const refreshedChildTask: ProjectTaskDetail = {
      ...childTask,
      title: '子任务 C（已更新）',
      status: 'done',
      assignee: '小李',
      updatedAt: '2026-04-04 13:00:00',
    };
    const childDetail: ProjectTaskDetail = {
      ...childTask,
      description: '补充说明',
    };

    vi.mocked(ApiProjectTask.getChildren)
      .mockResolvedValueOnce([childTask])
      .mockResolvedValueOnce([refreshedChildTask]);
    vi.mocked(ApiProjectTask.getDetail).mockResolvedValue(childDetail);

    renderWithQuery(
      <TaskSubtaskPanel
        parentTask={parentTask}
        statusConfigs={statusConfigs}
        onRefresh={vi.fn()}
        onEditTask={onEditTask}
      />,
    );

    await screen.findByText('子任务 C');
    await user.click(screen.getByRole('button', { name: '补充详情' }));

    await waitFor(() => {
      expect(ApiProjectTask.getDetail).toHaveBeenCalledWith(childTask.id);
    });
    await waitFor(() => {
      expect(onEditTask).toHaveBeenCalledWith(childDetail);
    });
    await waitFor(() => {
      expect(vi.mocked(ApiProjectTask.getChildren).mock.calls.length).toBeGreaterThan(1);
    });
    expect(await screen.findByText('子任务 C（已更新）')).toBeDefined();
  });

  it('无子任务时保留统计文案并隐藏空态提示', async () => {
    renderWithQuery(
      <TaskSubtaskPanel
        parentTask={parentTask}
        statusConfigs={statusConfigs}
        onRefresh={vi.fn()}
        onEditTask={vi.fn()}
      />,
    );

    expect(await screen.findByText('子任务列表')).toBeDefined();
    expect(await screen.findByText('已完成 0 / 0')).toBeDefined();
    expect(screen.queryByText('暂无子任务')).toBeNull();
  });
});

function renderWithQuery(component: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
}
