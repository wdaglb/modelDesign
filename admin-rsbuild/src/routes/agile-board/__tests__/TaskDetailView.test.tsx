import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { message, Modal } from 'antd';

import { ApiProjectTask, ApiProjectTaskDynamic, ApiUser } from '@/api';
import type { ProjectTaskDynamicItem } from '@/api/modules/project-task-dynamic';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import { copyTextToClipboard } from '@/utils';

import TaskDetailView from '../#TaskDetailView';

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();

  return {
    ...actual,
    Modal: {
      ...actual.Modal,
      confirm: vi.fn((options: { onOk?: () => unknown }) => {
        return options.onOk?.();
      }),
    },
    Mentions: (props: {
      disabled?: boolean;
      onChange?: (value: string) => void;
      onSearch?: (text: string, prefix: string) => void;
      placeholder?: string;
      rows?: number;
      value?: string;
    }) => {
      return (
        <textarea
          disabled={props.disabled}
          placeholder={props.placeholder}
          rows={props.rows}
          value={props.value}
          onChange={(event) => {
            const nextValue = event.target.value;
            const mentionMatch = nextValue.match(/(?:^|\s)@([^\s@]*)$/);

            props.onChange?.(nextValue);

            if (mentionMatch) {
              props.onSearch?.(mentionMatch[1], '@');
            }
          }}
        />
      );
    },
  };
});

vi.mock('@/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components')>();

  return {
    ...actual,
    KMarkdownPreview: (props: {
      value?: string;
      onTodoToggle?: (payload: { nextValue: string }) => void | Promise<void>;
    }) => {
      return (
        <div>
          <div>{props.value}</div>
          <button
            type={'button'}
            onClick={() => {
              void props.onTodoToggle?.({
                nextValue: '- [x] 已完成事项',
              });
            }}
          >
            切换待办
          </button>
        </div>
      );
    },
  };
});

vi.mock('@/api', () => {
  return {
    ApiProjectTask: {
      create: vi.fn(),
      deleted: vi.fn(),
      edit: vi.fn(),
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

vi.mock('@/utils', () => {
  return {
    copyTextToClipboard: vi.fn(),
  };
});

const statusConfigs: TaskStatusConfig[] = [
  {
    code: 'todo',
    name: '待处理',
    sort: 1,
    isCompleted: false,
  },
  {
    code: 'doing',
    name: '处理中',
    sort: 2,
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

const previewDynamicsWithMention: ProjectTaskDynamicItem[] = [
  {
    id: 2,
    taskId: 1001,
    content: '已同步给 @张三（zhangsan） 跟进联调结果。',
    operatorId: 7002,
    operatorName: '李四',
    createdAt: '2026-04-19 11:00:00',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(copyTextToClipboard).mockResolvedValue(undefined);
  vi.mocked(ApiProjectTaskDynamic.getList).mockResolvedValue({
    items: [],
    total: 0,
  });
  vi.mocked(ApiUser.getPageList).mockResolvedValue({
    items: [],
    total: 0,
  });
});

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

  it('@用户在动态时间线中会以 Tag 形式高亮展示', () => {
    renderWithQuery(
      <TaskDetailView
        task={task}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={previewDynamicsWithMention}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('动态 1'));

    const mentionTag = screen.getByText('@张三（zhangsan）');
    expect(mentionTag.closest('.ant-tag')).toBeTruthy();
    expect(screen.getByText('2026-04-19 11:00:00 · 李四')).toBeDefined();
  });

  it('支持以子任务 Tab 作为默认入口', () => {
    renderWithQuery(
      <TaskDetailView
        task={task}
        statusConfigs={statusConfigs}
        initialTabKey={'subtask'}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    expect(screen.getByText('新增子任务')).toBeDefined();
    expect(screen.getByText('暂无子任务')).toBeDefined();
  });

  it('会在标题前方渲染与敏捷面板一致的任务类型 Tag', () => {
    const taskWithType: ProjectTaskDetail = {
      ...task,
      typeId: 11,
      typeName: '需求',
    };

    renderWithQuery(
      <TaskDetailView
        task={taskWithType}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    const typeText = screen.getByText('需求');
    const titleText = screen.getByText('抽屉时间范围测试');
    const typeTag = typeText.closest('.ant-tag');

    expect(typeTag).toBeTruthy();
    expect(typeTag?.compareDocumentPosition(titleText)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('点击任务标题时会复制标题文案', async () => {
    const successMock = vi.spyOn(message, 'success').mockImplementation(() => {
      return undefined as never;
    });

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

    fireEvent.click(screen.getByText('抽屉时间范围测试'));

    await waitFor(() => {
      expect(copyTextToClipboard).toHaveBeenCalledWith('抽屉时间范围测试');
    });
    await waitFor(() => {
      expect(successMock).toHaveBeenCalledWith('任务标题已复制');
    });
  });

  it('子任务快捷创建成功后会重新聚焦输入框，便于连续创建', async () => {
    const onTaskUpdated = vi.fn().mockResolvedValue(undefined);

    vi.mocked(ApiProjectTask.create).mockResolvedValue({
      ...task,
      id: 3001,
      parentTaskId: task.id,
      title: '连续创建子任务',
      status: 'todo',
    });
    vi.mocked(ApiProjectTask.getChildren).mockResolvedValue([]);

    renderWithQuery(
      <TaskDetailView
        task={task}
        statusConfigs={statusConfigs}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={onTaskUpdated}
      />,
    );

    fireEvent.click(await screen.findByText('子任务 0'));

    const input = screen.getByPlaceholderText('输入子任务标题后回车创建');

    fireEvent.change(input, {
      target: { value: '连续创建子任务' },
    });
    fireEvent.click(screen.getByRole('button', { name: '新增子任务' }));

    await waitFor(() => {
      expect(ApiProjectTask.create).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(onTaskUpdated).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });
  });

  it('支持在子任务 Tab 中快捷修改标题', async () => {
    const onTaskUpdated = vi.fn().mockResolvedValue(undefined);
    const subtaskItem: ProjectTaskDetail = {
      ...task,
      id: 2001,
      parentTaskId: task.id,
      title: '旧子任务标题',
      status: 'todo',
      assignee: '小王',
      assigneeId: 901,
      dueTime: '2026-04-21 18:00:00',
      typeId: 11,
    };

    vi.mocked(ApiProjectTask.getChildren).mockResolvedValue([subtaskItem]);
    vi.mocked(ApiProjectTask.getDetail).mockResolvedValue(subtaskItem);
    vi.mocked(ApiProjectTask.edit).mockResolvedValue(subtaskItem);

    renderWithQuery(
      <TaskDetailView
        task={task}
        statusConfigs={statusConfigs}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={onTaskUpdated}
      />,
    );

    fireEvent.click(await screen.findByText('子任务 1'));

    const titleCell = await screen.findByText('旧子任务标题');
    fireEvent.click(titleCell);

    const titleInput = screen.getByDisplayValue('旧子任务标题');
    fireEvent.change(titleInput, {
      target: { value: '新子任务标题' },
    });
    fireEvent.keyDown(titleInput, {
      key: 'Enter',
    });

    await waitFor(() => {
      expect(ApiProjectTask.edit).toHaveBeenCalledWith(
        subtaskItem.id,
        expect.objectContaining({
          title: '新子任务标题',
        }),
      );
    });

    await waitFor(() => {
      expect(onTaskUpdated).toHaveBeenCalled();
    });
  });

  it('支持在子任务 Tab 中进入状态快捷编辑态', async () => {
    const subtaskItem: ProjectTaskDetail = {
      ...task,
      id: 2003,
      parentTaskId: task.id,
      title: '状态快捷编辑子任务',
      status: 'todo',
      assignee: '小王',
      assigneeId: 901,
      dueTime: '2026-04-21 18:00:00',
      typeId: 11,
    };

    vi.mocked(ApiProjectTask.getChildren).mockResolvedValue([subtaskItem]);
    vi.mocked(ApiProjectTask.getDetail).mockResolvedValue(subtaskItem);
    vi.mocked(ApiProjectTask.edit).mockResolvedValue({
      ...subtaskItem,
      status: 'doing',
    });

    renderWithQuery(
      <TaskDetailView
        task={task}
        statusConfigs={statusConfigs}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    fireEvent.click(await screen.findByText('子任务 1'));

    const subtaskStatusText = screen.getAllByText('待处理').at(-1);
    expect(subtaskStatusText).toBeTruthy();

    fireEvent.click(subtaskStatusText as HTMLElement);

    expect(await screen.findByText('处理中')).toBeDefined();
  });

  it('点击 markdown 待办事项后应立即保存任务详情', async () => {
    const onTaskUpdated = vi.fn().mockResolvedValue(undefined);

    vi.mocked(ApiProjectTask.edit).mockResolvedValue({
      ...task,
      description: '- [x] 已完成事项',
    });

    renderWithQuery(
      <TaskDetailView
        task={{
          ...task,
          description: '- [ ] 未完成事项',
        }}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={onTaskUpdated}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '切换待办' }));

    await waitFor(() => {
      expect(ApiProjectTask.edit).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          description: '- [x] 已完成事项',
        }),
      );
    });

    await waitFor(() => {
      expect(onTaskUpdated).toHaveBeenCalledTimes(1);
    });
  });

  it('支持在子任务 Tab 中进入负责人与截止时间快捷编辑态', async () => {
    const subtaskItem: ProjectTaskDetail = {
      ...task,
      id: 2002,
      parentTaskId: task.id,
      title: '子任务快捷编辑',
      status: 'todo',
      assignee: '小王',
      assigneeId: 902,
      dueTime: '2026-04-22 18:00:00',
      typeId: 12,
    };

    vi.mocked(ApiProjectTask.getChildren).mockResolvedValue([subtaskItem]);
    vi.mocked(ApiUser.getPageList).mockResolvedValue({
      items: [
        {
          id: 903,
          username: 'xiaoli',
          nickname: '小李',
        },
      ],
      total: 1,
    });

    const { container } = renderWithQuery(
      <TaskDetailView
        task={task}
        statusConfigs={statusConfigs}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    fireEvent.click(await screen.findByText('子任务 1'));

    fireEvent.click(await screen.findByText('小王'));
    expect(await screen.findByRole('combobox')).toBeTruthy();

    fireEvent.click(await screen.findByText('04-22'));
    expect(container.querySelector('.ant-picker')).toBeTruthy();
  });

  it('子任务操作列的详情按钮应在详情态打开子任务详情', async () => {
    const subtaskItem: ProjectTaskDetail = {
      ...task,
      id: 2010,
      parentTaskId: task.id,
      title: '详情态子任务',
      status: 'todo',
      assignee: '小王',
      assigneeId: 902,
      dueTime: '2026-04-23 18:00:00',
      typeId: 12,
    };
    const onEditTask = vi.fn().mockResolvedValue(undefined);

    vi.mocked(ApiProjectTask.getChildren).mockResolvedValue([subtaskItem]);

    renderWithQuery(
      <TaskDetailView
        task={task}
        statusConfigs={statusConfigs}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={onEditTask}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    fireEvent.click(await screen.findByText('子任务 1'));
    fireEvent.click(screen.getByRole('button', { name: '详情' }));

    await waitFor(() => {
      expect(onEditTask).toHaveBeenCalledWith(subtaskItem);
    });
  });

  it('子任务操作列的删除按钮应在详情态删除子任务并刷新', async () => {
    const subtaskItem: ProjectTaskDetail = {
      ...task,
      id: 2011,
      parentTaskId: task.id,
      title: '待删除子任务',
      status: 'todo',
      assignee: '小王',
      assigneeId: 903,
      dueTime: '2026-04-24 18:00:00',
      typeId: 13,
    };
    const onTaskUpdated = vi.fn().mockResolvedValue(undefined);

    vi.mocked(ApiProjectTask.getChildren).mockResolvedValue([subtaskItem]);
    vi.mocked(ApiProjectTask.deleted).mockResolvedValue(1);

    renderWithQuery(
      <TaskDetailView
        task={task}
        statusConfigs={statusConfigs}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={onTaskUpdated}
      />,
    );

    fireEvent.click(await screen.findByText('子任务 1'));
    fireEvent.click(screen.getByRole('button', { name: '删除' }));

    await waitFor(() => {
      expect(Modal.confirm).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(ApiProjectTask.deleted).toHaveBeenCalledWith([subtaskItem.id]);
    });
    await waitFor(() => {
      expect(onTaskUpdated).toHaveBeenCalled();
    });
  });

  it('动态输入框在输入 @ 关键字时会自动搜索用户', async () => {
    vi.mocked(ApiProjectTaskDynamic.getList).mockResolvedValue({
      items: [],
      total: 0,
    });
    vi.mocked(ApiUser.getPageList).mockResolvedValue({
      items: [],
      total: 0,
    });

    renderWithQuery(
      <TaskDetailView
        task={task}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('动态 0'));
    fireEvent.change(
      screen.getByPlaceholderText('输入本次进度说明，输入 @ 可自动搜索并插入用户'),
      {
        target: { value: '@张' },
      },
    );

    await waitFor(() => {
      expect(ApiUser.getPageList).toHaveBeenCalledWith({
        keyword: '张',
        current: 1,
        pageSize: 10,
      });
    });
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
