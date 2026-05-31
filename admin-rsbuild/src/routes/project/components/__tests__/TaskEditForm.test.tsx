import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';

import TaskEditForm from '../#TaskEditForm';

vi.mock('@/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components')>();

  return {
    ...actual,
    KMarkdownEditor: (props: { height?: number | string }) => {
      return (
        <div data-testid={'markdown-editor'} data-height={String(props.height)}>
          MarkdownEditor
        </div>
      );
    },
    UserSelect: () => {
      return <div>MockUserSelect</div>;
    },
  };
});

vi.mock('@/api', () => {
  return {
    ApiProject: {
      getList: vi.fn(() => {
        return Promise.resolve({
          items: [
            {
              id: 88,
              name: '研发项目',
            },
            {
              id: 99,
              name: '交付项目',
            },
          ],
          total: 2,
        });
      }),
    },
    ApiProjectTask: {
      edit: vi.fn(),
      create: vi.fn(),
      deleted: vi.fn(),
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
    showInAgileBoard: true,
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

describe('TaskEditForm', () => {
  it('应正确渲染统一任务编辑窗口字段', async () => {
    renderWithQuery(
      <TaskEditForm
        task={task}
        statusConfigs={statusConfigs}
      />,
    );

    expect(screen.getByText('任务标题')).toBeDefined();
    expect(screen.getByText('项目')).toBeDefined();
    expect(screen.getByText('类型')).toBeDefined();
    const taskTexts = await screen.findAllByText('任务');
    expect(taskTexts.length).toBeGreaterThan(0);
  });

  it('应为统一编辑窗口提供固定 Markdown 编辑高度', async () => {
    renderWithQuery(
      <TaskEditForm
        task={task}
        statusConfigs={statusConfigs}
      />,
    );

    const markdownEditor = await screen.findByTestId('markdown-editor');
    expect(markdownEditor.getAttribute('data-height')).toBe('520');
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
