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
  childTaskCount: 2,
} as AgileBoardTask;

const noSubtaskParentTask = {
  ...parentTask,
  id: 105,
  title: '无子任务入口隐藏',
  childTaskCount: 0,
} as AgileBoardTask;

/**
 * 生成指定数量的任务数据，用于验证列内完整渲染。
 */
function createTasks(count: number): AgileBoardTask[] {
  return Array.from({ length: count }).map((_, index) => {
    return {
      ...parentTask,
      id: 2000 + index,
      title: `任务-${index + 1}`,
    } as AgileBoardTask;
  });
}

describe('BoardColumn', () => {
  it('任务量较大时仍然完整渲染全部任务，不再使用虚拟滚动', () => {
    const tasks = createTasks(80);
    const { container } = render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={tasks}
          onOpenSubtasks={vi.fn()}
          onPreview={vi.fn()}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    const virtualTaskList = container.querySelector('[data-virtualized="true"]');
    const renderedTaskItems = container.querySelectorAll('[data-task-item="true"]');

    expect(virtualTaskList).toBeNull();
    expect(renderedTaskItems.length).toBe(80);
    expect(screen.getByText('任务-1')).toBeDefined();
    expect(screen.getByText('任务-80')).toBeDefined();
  });

  it('任务量较小时保持普通 flex 列表结构', () => {
    const tasks = createTasks(10);
    const { container } = render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={tasks}
          onOpenSubtasks={vi.fn()}
          onPreview={vi.fn()}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    const virtualTaskList = container.querySelector('[data-virtualized="true"]');

    expect(virtualTaskList).toBeNull();
    expect(screen.getByText('任务-1')).toBeDefined();
    expect(screen.getByText('任务-10')).toBeDefined();
  });

  it('列滚动容器保留底部留白，避免最后一张卡片贴底被遮挡', () => {
    const tasks = createTasks(10);
    const { container } = render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={tasks}
          onOpenSubtasks={vi.fn()}
          onPreview={vi.fn()}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    const columnBody = container.querySelector('div.ant-card-body > div');

    expect(columnBody).toBeTruthy();

    if (!columnBody) {
      return;
    }

    const columnBodyStyle = window.getComputedStyle(columnBody);

    expect(columnBodyStyle.paddingBottom).toBe('16px');
    expect(columnBodyStyle.boxSizing).toBe('border-box');
  });

  it('列无数据时展示 Empty 说明', () => {
    render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={[]}
          onOpenSubtasks={vi.fn()}
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
          onOpenSubtasks={vi.fn()}
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
    expect(shellStyle.overflow).toBe('hidden');
    expect(shellStyle.boxShadow).not.toBe('none');

    const cardElement = taskRoot.querySelector('.ant-card');

    expect(cardElement).toBeTruthy();

    if (!cardElement) {
      return;
    }

    const cardStyle = window.getComputedStyle(cardElement);

    expect(cardStyle.overflow).toBe('hidden');
  });

  it('会展示子任务入口行', () => {
    render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={[parentTask]}
          onOpenSubtasks={vi.fn()}
          onPreview={vi.fn()}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    expect(screen.getByText('子任务 2 项')).toBeDefined();
    expect(screen.getByRole('button', { name: '查看子任务' })).toBeDefined();
  });

  it('子任务数量为 0 时不展示子任务入口', () => {
    render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={[noSubtaskParentTask]}
          onOpenSubtasks={vi.fn()}
          onPreview={vi.fn()}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    expect(screen.queryByText('子任务 0 项')).toBeNull();
    expect(screen.queryByRole('button', { name: '查看子任务' })).toBeNull();
  });

  it('点击子任务入口时会打开独立查看区域而不是触发卡片预览', async () => {
    const user = userEvent.setup();
    const onOpenSubtasks = vi.fn<(_: AgileBoardTask) => Promise<void>>()
      .mockResolvedValue(undefined);
    const onPreview = vi.fn<(_: AgileBoardTask) => Promise<void>>()
      .mockResolvedValue(undefined);

    render(
      <DndContext>
        <BoardColumn
          column={column}
          tasks={[parentTask]}
          onOpenSubtasks={onOpenSubtasks}
          onPreview={onPreview}
          onPriorityChange={vi.fn()}
        />
      </DndContext>,
    );

    await user.click(screen.getByRole('button', { name: '查看子任务' }));

    expect(onOpenSubtasks).toHaveBeenCalledTimes(1);
    expect(onOpenSubtasks).toHaveBeenCalledWith(parentTask);
    expect(onPreview).not.toHaveBeenCalled();
  });
});
