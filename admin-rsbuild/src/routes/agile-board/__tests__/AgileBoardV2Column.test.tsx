import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { ReactNode } from 'react';
import type {
  AgileBoardColumnMeta,
  AgileBoardTask,
} from '@/routes/agile-board/#types';
import type { ProjectTaskType } from '@/api/modules/project-task-type';
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
  typeId: 2,
  assignee: '小王',
  dueTime: '2026-04-07',
  projectName: '火星项目',
  workDays: 3,
  childTaskCount: 2,
  taskNo: 'TASK-101',
} as AgileBoardTask;

const taskTypes: ProjectTaskType[] = [
  {
    id: 2,
    name: '缺陷',
    sort: 1,
    gitBranchPrefixGroup: 'bugfix',
  },
];

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

/**
 * 复用页面实际传感器配置，避免测试环境把普通点击误判成拖拽起手。
 *
 * @param props.children 需要放入拖拽上下文的节点
 * @returns 带激活阈值的测试拖拽上下文
 */
function TestDndContext(props: { children: ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  return <DndContext sensors={sensors}>{props.children}</DndContext>;
}

describe('AgileBoardV2Column', () => {
  it('使用轻量卡片列表渲染全部任务', () => {
    const { container } = render(
      <TestDndContext>
        <AgileBoardV2Column
          column={column}
          tasks={createTasks(24)}
          taskTypes={taskTypes}
          onOpenSubtasks={vi.fn()}
          onPreview={vi.fn()}
        />
      </TestDndContext>,
    );

    const cards = container.querySelectorAll('[data-v2-task-card="true"]');

    expect(cards.length).toBe(24);
    expect(screen.getByText('任务-1')).toBeDefined();
    expect(screen.getByText('任务-24')).toBeDefined();
  });

  it('列滚动容器保留底部留白，避免最后一张卡片被遮挡', () => {
    const { container } = render(
      <TestDndContext>
        <AgileBoardV2Column
          column={column}
          tasks={createTasks(6)}
          taskTypes={taskTypes}
          onOpenSubtasks={vi.fn()}
          onPreview={vi.fn()}
        />
      </TestDndContext>,
    );

    const columnBody = container.querySelector('[data-v2-column-body="true"]');

    expect(columnBody).toBeTruthy();

    if (!columnBody) {
      return;
    }

    const style = window.getComputedStyle(columnBody);

    expect(style.paddingBottom).toBe('14px');
    expect(style.overflowY).toBe('auto');
  });

  it('任务卡片具有统一最小高度，避免列内高低跳动', () => {
    const { container } = render(
      <TestDndContext>
        <AgileBoardV2Column
          column={column}
          tasks={[task]}
          taskTypes={taskTypes}
          onOpenSubtasks={vi.fn()}
          onPreview={vi.fn()}
        />
      </TestDndContext>,
    );

    const card = container.querySelector('[data-v2-task-card="true"]');

    expect(card).toBeTruthy();

    if (!card) {
      return;
    }

    const style = window.getComputedStyle(card);

    expect(style.minHeight).toBe('108px');
  });

  it('标题前方展示任务类型标签', () => {
    render(
      <TestDndContext>
        <AgileBoardV2Column
          column={column}
          tasks={[task]}
          taskTypes={taskTypes}
          onOpenSubtasks={vi.fn()}
          onPreview={vi.fn()}
        />
      </TestDndContext>,
    );

    expect(screen.getByText('缺陷')).toBeDefined();
    expect(screen.getByText('恢复列底部完整滚动')).toBeDefined();
  });

  it('卡片附加字段只展示项目和负责人', () => {
    render(
      <TestDndContext>
        <AgileBoardV2Column
          column={column}
          tasks={[task]}
          taskTypes={taskTypes}
          onOpenSubtasks={vi.fn()}
          onPreview={vi.fn()}
        />
      </TestDndContext>,
    );

    expect(screen.getByText('项目')).toBeDefined();
    expect(screen.getByText('火星项目')).toBeDefined();
    expect(screen.getByText('负责人')).toBeDefined();
    expect(screen.getByText('小王')).toBeDefined();
    expect(screen.queryByText('分支名')).toBeNull();
    expect(screen.queryByText('截止时间')).toBeNull();
    expect(screen.queryByText('工时')).toBeNull();
    expect(screen.queryByText('bugfix/alice-dev/TASK-101')).toBeNull();
    expect(screen.queryByText('2026-04-07')).toBeNull();
    expect(screen.queryByText('3 人天')).toBeNull();
  });

  it('卡片中不展示任务说明文本', () => {
    render(
      <TestDndContext>
        <AgileBoardV2Column
          column={column}
          tasks={[task]}
          taskTypes={taskTypes}
          onOpenSubtasks={vi.fn()}
          onPreview={vi.fn()}
        />
      </TestDndContext>,
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
      <TestDndContext>
        <AgileBoardV2Column
          column={column}
          tasks={[task]}
          taskTypes={taskTypes}
          onOpenSubtasks={vi.fn()}
          onPreview={onPreview}
        />
      </TestDndContext>,
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
      <TestDndContext>
        <AgileBoardV2Column
          column={column}
          tasks={[task]}
          taskTypes={taskTypes}
          onOpenSubtasks={onOpenSubtasks}
          onPreview={onPreview}
        />
      </TestDndContext>,
    );

    await user.click(screen.getByRole('button', { name: '查看子任务（2）' }));

    expect(onOpenSubtasks).toHaveBeenCalledWith(task);
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('空列提示用户可直接拖拽任务进入当前列', () => {
    render(
      <TestDndContext>
        <AgileBoardV2Column
          column={column}
          tasks={[]}
          taskTypes={taskTypes}
          onOpenSubtasks={vi.fn()}
          onPreview={vi.fn()}
        />
      </TestDndContext>,
    );

    expect(screen.getByText('拖拽任务到这里')).toBeDefined();
  });
});
