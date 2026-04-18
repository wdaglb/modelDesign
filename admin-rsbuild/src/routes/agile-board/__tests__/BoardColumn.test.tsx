import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';

import type {
  AgileBoardColumnMeta,
  AgileBoardTask,
} from '@/routes/agile-board/#types';
import BoardColumn from '@/routes/agile-board/components/BoardColumn';

const column: AgileBoardColumnMeta = {
  status: 'todo',
  title: '待处理',
  isCompleted: false,
  accentColor: '#2563eb',
  background: 'rgba(37, 99, 235, 0.05)',
};

const parentTask = {
  id: 101,
  projectId: 88,
  title: '恢复卡片强调色',
  status: 'todo',
  priority: 'high',
  assignee: '小王',
  dueTime: '2026-04-07',
  projectName: '火星项目',
  workDays: 3,
} as AgileBoardTask;

const childTask = {
  ...parentTask,
  id: 102,
  title: '子任务 A',
} as AgileBoardTask;

describe('BoardColumn', () => {
  it('列无数据时展示 Empty 说明', () => {
    render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={[]}
          subtaskMap={new Map()}
          onPreview={vi.fn()}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    expect(screen.getByText('拖拽任务到这里')).toBeDefined();
  });

  it('父任务卡片保留白底并追加外层强调边框与阴影', () => {
    const { container } = render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={[parentTask]}
          subtaskMap={new Map()}
          onPreview={vi.fn()}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    const taskRoot = container.querySelector('[data-task-card-root="true"]');

    expect(taskRoot).toBeTruthy();

    if (!taskRoot || !taskRoot.parentElement) {
      return;
    }

    const shellStyle = window.getComputedStyle(taskRoot.parentElement);

    expect(shellStyle.borderTopWidth).toBe('1px');
    expect(shellStyle.boxShadow).not.toBe('none');
  });

  it('父任务无子任务时不渲染子任务区', () => {
    const { container } = render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={[parentTask]}
          subtaskMap={new Map()}
          onPreview={vi.fn()}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    expect(container.querySelector('[data-subtask-list="true"]')).toBeNull();
    expect(screen.queryByText('暂无子任务')).toBeNull();
  });

  it('父任务有子任务时默认收起子任务内容', () => {
    const { container } = render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={[parentTask]}
          subtaskMap={new Map([[parentTask.id, [childTask]]])}
          onPreview={vi.fn()}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    expect(screen.getByRole('button', { name: '展开子任务' })).toBeDefined();
    expect(container.querySelector('[data-subtask-list="true"]')).toBeNull();
    expect(screen.queryByText('子任务 A')).toBeNull();
  });

  it('子任务列表支持展开与收起', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={[parentTask]}
          subtaskMap={new Map([[parentTask.id, [childTask]]])}
          onPreview={vi.fn()}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    await user.click(screen.getByRole('button', { name: '展开子任务' }));

    expect(container.querySelector('[data-subtask-list="true"]')).toBeTruthy();
    expect(screen.getByText('子任务 A')).toBeDefined();

    await user.click(screen.getByRole('button', { name: '收起子任务' }));

    expect(container.querySelector('[data-subtask-list="true"]')).toBeNull();
    expect(screen.queryByText('子任务 A')).toBeNull();
  });

  it('子任务列表使用更明显的左侧缩进', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={[parentTask]}
          subtaskMap={new Map([[parentTask.id, [childTask]]])}
          onPreview={vi.fn()}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    await user.click(screen.getByRole('button', { name: '展开子任务' }));

    const subtaskList = container.querySelector('[data-subtask-list="true"]');

    expect(subtaskList).toBeTruthy();

    if (!subtaskList) {
      return;
    }

    const subtaskStyle = window.getComputedStyle(subtaskList);

    expect(subtaskStyle.paddingLeft).toBe('24px');
  });
});
