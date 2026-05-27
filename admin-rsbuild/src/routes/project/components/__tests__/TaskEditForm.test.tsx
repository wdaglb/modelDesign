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
      getList: vi.fn(),
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

const previewChangeLogs: ProjectTaskChangeLogItem[] = [];
describe('TaskEditForm', () => {
  it('full 模式应正确渲染类型下拉，不应出现未定义变量错误', async () => {
    renderWithQuery(
      <TaskEditForm
        mode={'full'}
        task={task}
        statusConfigs={statusConfigs}
        previewChangeLogs={previewChangeLogs}
      />,
    );

    expect(screen.getByText('任务标题')).toBeDefined();
    expect(screen.getByText('类型')).toBeDefined();
    const taskTexts = await screen.findAllByText('任务');
    expect(taskTexts.length).toBeGreaterThan(0);
  });

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

  it('drawer 模式应为 Markdown 编辑区提供更大的编辑高度', async () => {
    renderWithQuery(
      <TaskEditForm
        mode={'drawer'}
        task={task}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={previewChangeLogs}
      />,
    );

    const markdownEditor = await screen.findByTestId('markdown-editor');
    expect(markdownEditor.getAttribute('data-height')).toBe('560');
  });

  it('drawer 编辑态不再展示子任务和变更日志 Tab', async () => {
    renderWithQuery(
      <TaskEditForm
        mode={'drawer'}
        task={task}
        statusConfigs={statusConfigs}
        previewChangeLogs={previewChangeLogs}
      />,
    );

    expect(screen.queryByText(/^子任务/)).toBeNull();
    expect(screen.queryByText(/^变更日志/)).toBeNull();
    expect(screen.getByText('任务详情（Markdown）')).toBeDefined();
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
