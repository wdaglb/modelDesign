import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import type { ProjectTaskChangeLogItem } from '@/api/modules/project-task-change-log';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';

import TaskEditForm from '../#TaskEditForm';

vi.mock('@/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components')>();

  return {
    ...actual,
    KMarkdownEditor: () => {
      return <div>MarkdownEditor</div>;
    },
    UserSelect: () => {
      return <div>MockUserSelect</div>;
    },
  };
});

vi.mock('@/api', () => {
  return {
    ApiProject: {
      getList: vi.fn(),
    },
    ApiProjectTask: {
      edit: vi.fn(),
      create: vi.fn(),
      getChildren: vi.fn(),
    },
    ApiProjectTaskChangeLog: {
      getList: vi.fn(),
    },
    ApiProjectTaskType: {
      getList: vi.fn(() => {
        return Promise.resolve([
          {
            id: 501,
            name: '任务',
            sort: 1,
          },
        ]);
      }),
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
  projectId: 88,
  projectCode: 'TASK',
  taskNo: 'TASK-1001',
  title: '原始标题',
  description: '原始说明',
  typeId: 501,
  typeName: '任务',
  status: 'todo',
  priority: 'high',
  assigneeId: 301,
  assignee: '张三',
  workDays: 2,
};

const previewChangeLogs: ProjectTaskChangeLogItem[] = [];

describe('TaskEditForm', () => {
  it('drawer 模式应展示类型字段', async () => {
    renderWithQuery(
      <TaskEditForm
        mode={'drawer'}
        task={task}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={previewChangeLogs}
      />,
    );

    expect(screen.getByText('类型')).toBeDefined();
    expect(await screen.findByText('任务')).toBeDefined();
  });
});

/**
 * 为编辑表单测试提供 React Query 上下文。
 *
 * @param element 待渲染节点
 * @returns 渲染结果
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
