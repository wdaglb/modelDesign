import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';

import { copyTextToClipboard } from '@/utils';

import TaskCard from '../TaskCard';
import type { TaskCardTask } from '../TaskCard.types';

vi.mock('@/utils', () => {
  return {
    copyTextToClipboard: vi.fn(),
  };
});

const baseTask: TaskCardTask = {
  id: 101,
  taskNumber: 'TASK-101',
  projectName: '火星项目',
  title: '补充任务编号展示',
  latestDynamicSummary: '已补充最新动态摘要展示',
  priority: 'high',
  assignee: '小王',
  dueTime: '2026-04-06',
  workDays: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TaskCard', () => {
  it('点击左上角任务编号时复制内容并拦截详情打开', async () => {
    const onPreview = vi.fn();
    const successMock = vi.spyOn(message, 'success').mockImplementation(() => {
      return undefined as never;
    });

    render(<TaskCard task={baseTask} onPreview={onPreview} />);

    const taskNumber = screen.getByText('# TASK-101');

    expect(taskNumber).toBeDefined();
    expect(taskNumber.getAttribute('data-task-card-copy-trigger')).toBe('true');

    fireEvent.click(taskNumber);

    await waitFor(() => {
      expect(copyTextToClipboard).toHaveBeenCalledWith('TASK-101');
    });
    await waitFor(() => {
      expect(successMock).toHaveBeenCalledWith('任务编号已复制');
    });
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('任务编号复制失败时给出错误提示', async () => {
    const errorMock = vi.spyOn(message, 'error').mockImplementation(() => {
      return undefined as never;
    });

    vi.mocked(copyTextToClipboard).mockRejectedValue(new Error('copy failed'));

    render(<TaskCard task={baseTask} />);

    fireEvent.click(screen.getByText('# TASK-101'));

    await waitFor(() => {
      expect(errorMock).toHaveBeenCalledWith('任务编号复制失败，请稍后重试');
    });
  });

  it('任务编号在按下阶段阻断拖拽监听', () => {
    const onMouseDown = vi.fn();
    const onPointerDown = vi.fn();

    render(
      <TaskCard
        task={baseTask}
        rootProps={{
          onMouseDown,
          onPointerDown,
        }}
      />,
    );

    const taskNumber = screen.getByText('# TASK-101');

    fireEvent.mouseDown(taskNumber);
    fireEvent.pointerDown(taskNumber);

    expect(onMouseDown).not.toHaveBeenCalled();
    expect(onPointerDown).not.toHaveBeenCalled();
  });

  it('紧凑态与子任务态提供可断言标记', () => {
    const { container } = render(
      <TaskCard task={baseTask} compact isSubtask />,
    );

    const rootNode = container.querySelector('[data-task-card-root="true"]');

    expect(rootNode).toBeDefined();

    if (!rootNode) {
      return;
    }

    expect(rootNode.getAttribute('data-task-card-compact')).toBe('true');
    expect(rootNode.getAttribute('data-task-card-subtask')).toBe('true');
  });

  it('子任务态仍展示完整元信息', () => {
    render(<TaskCard task={baseTask} compact isSubtask />);

    expect(screen.getByText('# TASK-101')).toBeTruthy();
    expect(screen.getByText('火星项目')).toBeTruthy();
    expect(screen.getByText('2 人天')).toBeTruthy();
    expect(screen.getByText('小王')).toBeTruthy();
    expect(screen.getByText('截止 2026-04-06')).toBeTruthy();
  });

  it('非紧凑态在卡片顶部使用单行 Alert 展示最新动态摘要', () => {
    render(<TaskCard task={baseTask} />);

    expect(screen.getByText('已补充最新动态摘要展示')).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('紧凑态也在卡片顶部展示最新动态摘要且不显示标签', () => {
    render(<TaskCard task={baseTask} compact />);

    expect(screen.getByText('已补充最新动态摘要展示')).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByText('最新动态')).toBeNull();
  });
});
