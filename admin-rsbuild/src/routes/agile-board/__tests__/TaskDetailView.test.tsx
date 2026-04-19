import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import type { ProjectTaskDynamicItem } from '@/api/modules/project-task-dynamic';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';

import TaskDetailView from '../#TaskDetailView';

vi.mock('@/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components')>();

  return {
    ...actual,
    KMarkdownPreview: (props: { value?: string }) => {
      return <div>{props.value}</div>;
    },
  };
});

vi.mock('@/api', () => {
  return {
    ApiProjectTask: {
      create: vi.fn(),
      edit: vi.fn(),
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

const statusConfigs: TaskStatusConfig[] = [
  {
    code: 'todo',
    name: '待处理',
    sort: 1,
    isCompleted: false,
  },
];

const task: ProjectTaskDetail = {
  id: 1001,
  projectId: 77,
  projectCode: 'TASK',
  title: '抽屉时间范围测试',
  status: 'todo',
  priority: 'high',
  description: '任务说明',
  startTime: '2026-04-19 09:30:00',
  dueTime: '2026-04-20 18:00:00',
};

const previewDynamics: ProjectTaskDynamicItem[] = [
  {
    id: 1,
    taskId: 1001,
    content: '已完成接口联调，等待测试回归。',
    operatorId: 7001,
    operatorName: '张三',
    createdAt: '2026-04-19 10:00:00',
  },
];

describe('TaskDetailView', () => {
  it('查看态会直接渲染时间范围选择器并回显起止时间', () => {
    renderWithQuery(
      <TaskDetailView
        task={task}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    expect(screen.getByText('时间')).toBeDefined();
    expect(screen.getByDisplayValue('2026-04-19')).toBeDefined();
    expect(screen.getByDisplayValue('2026-04-20')).toBeDefined();
  });

  it('动态 Tab 应展示预置动态内容', () => {
    renderWithQuery(
      <TaskDetailView
        task={task}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={previewDynamics}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('动态 1'));

    expect(screen.getByText('已完成接口联调，等待测试回归。')).toBeDefined();
    expect(screen.getByText('2026-04-19 10:00:00 · 张三')).toBeDefined();
  });
});

/**
 * 为需要 React Query 上下文的组件提供最小测试壳。
 *
 * @param element 待渲染节点
 * @return Testing Library 渲染结果
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
