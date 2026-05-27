import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ApiProjectTask,
  ApiProjectTaskChangeLog,
  ApiProjectTaskDynamic,
} from '@/api';
import { useKDrawer } from '@/components/KDrawer';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';

import TaskPreviewDrawer from '../#TaskPreviewDrawer';

const drawerOpen = vi.fn();
const nestedTask: ProjectTaskDetail = {
  id: 2002,
  title: '子任务详情',
  projectId: 77,
  projectCode: 'TASK',
  status: 'todo',
  priority: 'high',
};

vi.mock('@/api', () => {
  return {
    ApiProjectTask: {
      getDetail: vi.fn(),
      getChildren: vi.fn(),
    },
    ApiProjectTaskChangeLog: {
      getList: vi.fn(),
    },
    ApiProjectTaskDynamic: {
      getList: vi.fn(),
      create: vi.fn(),
    },
    ApiProjectTaskType: {
      getList: vi.fn(),
    },
    ApiUser: {
      getPageList: vi.fn(),
    },
  };
});

vi.mock('@/components/KDrawer', () => {
  return {
    useKDrawer: vi.fn(),
  };
});

vi.mock('@/routes/project/components/#TaskEditForm', () => {
  return {
    default: () => null,
  };
});

/**
 * 任务详情抽屉测试。
 */
describe('TaskPreviewDrawer', () => {
  const statusConfigs: TaskStatusConfig[] = [
    {
      code: 'todo',
      name: '待处理',
      sort: 1,
      isCompleted: false,
      showInAgileBoard: true,
    },
  ];

  const task: ProjectTaskDetail = {
    id: 1001,
    title: '主任务详情',
    projectId: 77,
    projectCode: 'TASK',
    status: 'todo',
    priority: 'high',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    drawerOpen.mockResolvedValue(undefined);
    vi.mocked(useKDrawer).mockReturnValue({
      open: drawerOpen,
    });
    vi.mocked(ApiProjectTask.getDetail).mockResolvedValue(task);
    vi.mocked(ApiProjectTask.getChildren).mockResolvedValue([nestedTask]);
    vi.mocked(ApiProjectTaskChangeLog.getList).mockResolvedValue({
      items: [],
      total: 0,
    });
    vi.mocked(ApiProjectTaskDynamic.getList).mockResolvedValue({
      items: [],
      total: 0,
    });
  });

  it('子任务详情应继续打开任务详情抽屉，而不是走编辑弹窗回调', async () => {
    const onEdit = vi.fn<(task: ProjectTaskDetail) => Promise<void>>()
      .mockResolvedValue(undefined);
    const onTaskUpdated = vi.fn<() => Promise<void>>()
      .mockResolvedValue(undefined);

    renderWithQuery(
      <TaskPreviewDrawer
        taskId={task.id}
        statusConfigs={statusConfigs}
        onTaskUpdated={onTaskUpdated}
        onEdit={onEdit}
      />,
    );

    fireEvent.click(await screen.findByText('子任务 1'));
    await screen.findByText(nestedTask.title);
    fireEvent.click(await screen.findByRole('button', { name: '详情' }));

    await waitFor(() => {
      expect(drawerOpen).toHaveBeenCalledTimes(1);
    });

    expect(onEdit).not.toHaveBeenCalled();

    const openProps = drawerOpen.mock.calls[0]?.[0];
    expect(openProps.title).toBe('任务详情');
    expect(openProps.size).toBe(840);
    expect(openProps.children.props.taskId).toBe(nestedTask.id);
    expect(openProps.children.props.onEdit).toBe(onEdit);
  });
});

/**
 * 使用查询客户端渲染组件，避免各用例共享缓存状态。
 *
 * @param element 待渲染元素
 */
function renderWithQuery(element: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{element}</QueryClientProvider>,
  );
}
