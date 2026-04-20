import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  AgileBoardColumnMeta,
  AgileBoardTask,
} from '@/routes/agile-board/#types';
import AgileBoardV2Column from '@/routes/agile-board/v2/#AgileBoardV2Column';

const column: AgileBoardColumnMeta = {
  status: 'todo',
  title: '待处理',
  isCompleted: false,
  accentColor: '#2563eb',
  background: 'rgba(37, 99, 235, 0.05)',
};

const task = {
  id: 101,
  projectId: 88,
  title: '恢复列底部完整滚动',
  description:
    '最后一张卡片在旧版布局里容易被底部裁切，这里需要通过真实滚动容器留白解决。',
  status: 'todo',
  priority: 'high',
  typeName: '缺陷',
  assignee: '小王',
  dueTime: '2026-04-07',
  projectName: '火星项目',
  workDays: 3,
  childTaskCount: 2,
  taskNo: 'TASK-101',
} as AgileBoardTask;

/**
 * 生成指定数量的任务数据，用于验证 v2 列表的固定卡片输出。
 */
function createTasks(count: number): AgileBoardTask[] {
  return Array.from({ length: count }).map((_, index) => {
    return {
      ...task,
      id: 2000 + index,
      title: `任务-${index + 1}`,
      taskNo: `TASK-${2000 + index}`,
    } as AgileBoardTask;
  });
}

describe('AgileBoardV2Column', () => {
  it('使用轻量卡片列表渲染全部任务', () => {
    const { container } = render(
      <AgileBoardV2Column
        column={column}
        tasks={createTasks(24)}
        onOpenSubtasks={vi.fn()}
        onPreview={vi.fn()}
      />,
    );

    const cards = container.querySelectorAll('[data-v2-task-card="true"]');

    expect(cards.length).toBe(24);
    expect(screen.getByText('任务-1')).toBeDefined();
    expect(screen.getByText('任务-24')).toBeDefined();
  });

  it('列滚动容器保留底部留白，避免最后一张卡片被遮挡', () => {
    const { container } = render(
      <AgileBoardV2Column
        column={column}
        tasks={createTasks(6)}
        onOpenSubtasks={vi.fn()}
        onPreview={vi.fn()}
      />,
    );

    const columnBody = container.querySelector('[data-v2-column-body="true"]');

    expect(columnBody).toBeTruthy();

    if (!columnBody) {
      return;
    }

    const style = window.getComputedStyle(columnBody);

    expect(style.paddingBottom).toBe('18px');
    expect(style.overflowY).toBe('auto');
  });

  it('任务卡片具有统一最小高度，避免列内高低跳动', () => {
    const { container } = render(
      <AgileBoardV2Column
        column={column}
        tasks={[task]}
        onOpenSubtasks={vi.fn()}
        onPreview={vi.fn()}
      />,
    );

    const card = container.querySelector('[data-v2-task-card="true"]');

    expect(card).toBeTruthy();

    if (!card) {
      return;
    }

    const style = window.getComputedStyle(card);

    expect(style.minHeight).toBe('152px');
  });

  it('标题前方展示任务类型标签', () => {
    render(
      <AgileBoardV2Column
        column={column}
        tasks={[task]}
        onOpenSubtasks={vi.fn()}
        onPreview={vi.fn()}
      />,
    );

    expect(screen.getByText('缺陷')).toBeDefined();
    expect(screen.getByText('恢复列底部完整滚动')).toBeDefined();
  });

  it('卡片中不展示任务说明文本', () => {
    render(
      <AgileBoardV2Column
        column={column}
        tasks={[task]}
        onOpenSubtasks={vi.fn()}
        onPreview={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(/最后一张卡片在旧版布局里容易被底部裁切/i),
    ).toBeNull();
  });

  it('点击卡片时会打开任务预览', async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn<(_: AgileBoardTask) => Promise<void>>()
      .mockResolvedValue(undefined);

    render(
      <AgileBoardV2Column
        column={column}
        tasks={[task]}
        onOpenSubtasks={vi.fn()}
        onPreview={onPreview}
      />,
    );

    await user.click(screen.getByRole('button', { name: /恢复列底部完整滚动/i }));

    expect(onPreview).toHaveBeenCalledWith(task);
  });

  it('点击子任务入口时只打开子任务区域', async () => {
    const user = userEvent.setup();
    const onOpenSubtasks = vi.fn<(_: AgileBoardTask) => Promise<void>>()
      .mockResolvedValue(undefined);
    const onPreview = vi.fn<(_: AgileBoardTask) => Promise<void>>()
      .mockResolvedValue(undefined);

    render(
      <AgileBoardV2Column
        column={column}
        tasks={[task]}
        onOpenSubtasks={onOpenSubtasks}
        onPreview={onPreview}
      />,
    );

    await user.click(screen.getByRole('button', { name: '查看子任务（2）' }));

    expect(onOpenSubtasks).toHaveBeenCalledWith(task);
    expect(onPreview).not.toHaveBeenCalled();
  });
});
