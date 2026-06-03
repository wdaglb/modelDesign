import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Modal } from 'antd';

import {
  ApiProjectTask,
  ApiProjectTaskDynamic,
  ApiProjectTaskType,
  ApiUser,
} from '@/api';
import type { ProjectTaskChangeLogItem } from '@/api/modules/project-task-change-log';
import type { ProjectTaskDynamicItem } from '@/api/modules/project-task-dynamic';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import useAuthStore from '@/store/auth.ts';

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

vi.mock('@/store/auth.ts', () => {
  return {
    default: vi.fn(),
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
  {
    code: 'doing',
    name: '处理中',
    sort: 2,
    isCompleted: false,
    showInAgileBoard: true,
  },
];

const task: ProjectTaskDetail = {
  id: 1001,
  projectId: 77,
  projectCode: 'TASK',
  projectName: '模型设计平台',
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

const previewCreateChangeLogs: ProjectTaskChangeLogItem[] = [
  {
    id: 11,
    taskId: 1001,
    operationType: 'create',
    operationText: '创建任务',
    operatorId: 7003,
    operatorName: '王五',
    createdAt: '2026-04-19 12:00:00',
    changes: [
      {
        field: 'title',
        label: '任务标题',
        beforeValue: '-',
        afterValue: '抽屉时间范围测试',
      },
      {
        field: 'priority',
        label: '任务优先级',
        beforeValue: '-',
        afterValue: '高',
      },
    ],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuthStore).mockImplementation((selector) => {
    return selector({
      currentInfo: {
        gitUsername: 'alice-dev',
      },
    });
  });
  vi.mocked(ApiProjectTaskDynamic.getList).mockResolvedValue({
    items: [],
    total: 0,
  });
  vi.mocked(ApiProjectTaskType.getList).mockResolvedValue([]);
  vi.mocked(ApiUser.getPageList).mockResolvedValue({
    items: [],
    total: 0,
  });
});

describe('TaskDetailView', () => {
  it('查看态应展示任务所属项目', () => {
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

    const projectLabel = screen.getByText('所属项目');
    const projectValue = screen.getByText('模型设计平台');

    expect(projectLabel.closest('.ant-tag')).toBeNull();
    expect(projectValue.closest('.ant-tag')).toBeNull();
  });

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

  it('子任务详情应展示父任务链接并可打开父任务详情', async () => {
    const user = userEvent.setup();
    const onEditTask = vi.fn().mockResolvedValue(undefined);
    const childTask: ProjectTaskDetail = {
      ...task,
      id: 2001,
      parentTaskId: task.id,
      parentTaskTitle: '父任务标题',
      title: '子任务标题',
    };

    renderWithQuery(
      <TaskDetailView
        task={childTask}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={onEditTask}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    await user.click(screen.getByText('父任务：父任务标题'));

    expect(onEditTask).toHaveBeenCalledWith(
      expect.objectContaining({
        id: task.id,
        title: '父任务标题',
      }),
    );
  });

  it('空迭代任务不应展示迭代 null 兜底项', () => {
    renderWithQuery(
      <TaskDetailView
        task={{
          ...task,
          iterationId: null as unknown as number,
        }}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    expect(screen.queryByText('迭代#null')).toBeNull();
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

  it('创建任务日志应展示为单条摘要而不是逐字段变更', () => {
    renderWithQuery(
      <TaskDetailView
        task={task}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={previewCreateChangeLogs}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('变更日志 1'));

    expect(screen.getByText('创建任务')).toBeDefined();
    expect(screen.queryByText(/任务标题：- → 抽屉时间范围测试/)).toBeNull();
    expect(screen.queryByText(/任务优先级：- → 高/)).toBeNull();
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

  it('任务标题使用 Typography copyable 提供复制入口', () => {
    const { container } = renderWithQuery(
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

    const titleElement = screen.getByText('抽屉时间范围测试');
    const copyableTitle = titleElement.closest('.ant-typography');

    expect(copyableTitle).toBeTruthy();
    expect(copyableTitle?.classList.contains('task-detail-copyable-title'))
      .toBe(true);
    expect(copyableTitle?.querySelector('.ant-typography-copy')).toBeTruthy();
    expect(container.querySelectorAll('.ant-typography-copy').length)
      .toBeGreaterThanOrEqual(2);
  });

  it('任务编号文本使用 Typography copyable 提供复制入口', () => {
    renderWithQuery(
      <TaskDetailView
        task={{
          ...task,
          taskNo: 'TASK-1001',
        }}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    const taskNumberElement = screen.getByText('TASK-1001');
    const copyableTaskNumber = taskNumberElement.closest('.ant-typography');

    expect(copyableTaskNumber).toBeTruthy();
    expect(copyableTaskNumber?.querySelector('.ant-typography-copy')).toBeTruthy();
  });

  it('任务类型配置前缀后分支名使用 Typography copyable 提供复制入口', async () => {
    vi.mocked(ApiProjectTaskType.getList).mockResolvedValue([
      {
        id: 2,
        name: '缺陷',
        sort: 1,
        gitBranchPrefixGroup: 'bugfix',
      },
    ]);

    renderWithQuery(
      <TaskDetailView
        task={{
          ...task,
          taskNo: 'TASK-1001',
          typeId: 2,
          typeName: '缺陷',
        }}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    expect(await screen.findByText('bugfix/alice-dev/TASK-1001')).toBeDefined();

    const branchNameElement = screen.getByText('bugfix/alice-dev/TASK-1001');
    const copyableBranchName = branchNameElement.closest('.ant-typography');

    expect(copyableBranchName).toBeTruthy();
    expect(copyableBranchName?.querySelector('.ant-typography-copy')).toBeTruthy();
  });

  it('分支名右侧会展示当前迭代并支持快捷修改', async () => {
    const user = userEvent.setup();
    const onTaskUpdated = vi.fn().mockResolvedValue(undefined);

    vi.mocked(ApiProjectTask.edit).mockResolvedValue({
      ...task,
      iterationId: 2,
      iterationName: '第二迭代',
    });

    renderWithQuery(
      <TaskDetailView
        task={{
          ...task,
          iterationId: 1,
          iterationName: '第一迭代',
        }}
        iterations={[
          {
            id: 1,
            name: '第一迭代',
            startDate: '2026-04-01',
            endDate: '2026-04-15',
            published: true,
          },
          {
            id: 2,
            name: '第二迭代',
            startDate: '2026-04-16',
            endDate: '2026-04-30',
            published: true,
          },
        ]}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={onTaskUpdated}
      />,
    );

    expect(screen.getByTitle('第一迭代')).toBeDefined();

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByTitle('第二迭代'));

    await waitFor(() => {
      expect(ApiProjectTask.edit).toHaveBeenCalledWith(
        task.id,
        expect.objectContaining({
          iterationId: 2,
        }),
      );
    });

    await waitFor(() => {
      expect(onTaskUpdated).toHaveBeenCalledTimes(1);
    });
  });

  it('未配置个人 Git 用户名时仅展示不可复制提示', async () => {
    vi.mocked(useAuthStore).mockImplementation((selector) => {
      return selector({
        currentInfo: {
          gitUsername: '',
        },
      });
    });
    vi.mocked(ApiProjectTaskType.getList).mockResolvedValue([
      {
        id: 2,
        name: '缺陷',
        sort: 1,
        gitBranchPrefixGroup: 'bugfix',
      },
    ]);

    renderWithQuery(
      <TaskDetailView
        task={{
          ...task,
          taskNo: 'TASK-1001',
          typeId: 2,
          typeName: '缺陷',
        }}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    expect(
      await screen.findByText('请先在个人中心配置 Git 用户名'),
    ).toBeDefined();
    expect(
      screen.queryByRole('button', { name: '请先在个人中心配置 Git 用户名' }),
    ).toBeNull();
  });

  it('任务类型未配置前缀时仅展示不可复制提示', async () => {
    vi.mocked(ApiProjectTaskType.getList).mockResolvedValue([
      {
        id: 1,
        name: '任务',
        sort: 1,
        gitBranchPrefixGroup: '',
      },
    ]);

    renderWithQuery(
      <TaskDetailView
        task={{
          ...task,
          taskNo: 'TASK-1001',
          typeId: 1,
          typeName: '任务',
        }}
        statusConfigs={statusConfigs}
        previewSubtasks={[]}
        previewChangeLogs={[]}
        previewDynamics={[]}
        onEditTask={vi.fn()}
        onEnterEdit={vi.fn()}
        onTaskUpdated={vi.fn()}
      />,
    );

    expect(await screen.findByText('当前任务类型未配置分支前缀')).toBeDefined();
    expect(
      screen.queryByRole('button', { name: '当前任务类型未配置分支前缀' }),
    ).toBeNull();
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
    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThan(1);
    });

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
