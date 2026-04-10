import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import ClipboardJS from 'clipboard';

import TaskCard from '../TaskCard';
import type { TaskCardTask } from '../TaskCard.types';

const clipboardMockState = vi.hoisted(() => {
  return {
    handlers: {} as Record<string, (() => void) | undefined>,
    destroy: vi.fn(),
  };
});

vi.mock('clipboard', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      clipboardMockState.handlers = {};
      clipboardMockState.destroy = vi.fn();

      return {
        on(eventName: string, handler: () => void) {
          clipboardMockState.handlers[eventName] = handler;
        },
        destroy: clipboardMockState.destroy,
      };
    }),
  };
});

const baseTask: TaskCardTask = {
  id: 101,
  taskNumber: 'TASK-101',
  projectName: '火星项目',
  title: '补充任务编号展示',
  priority: 'high',
  assignee: '小王',
  dueTime: '2026-04-06',
  workDays: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  clipboardMockState.handlers = {};
  clipboardMockState.destroy = vi.fn();
});

describe('TaskCard', () => {
  it('点击左上角任务编号时复制内容并拦截详情打开', async () => {
    const onPreview = vi.fn();
    const successMock = vi
      .spyOn(message, 'success')
      .mockImplementation(() => {
        return undefined as never;
      });

    render(<TaskCard task={baseTask} onPreview={onPreview} />);

    const taskNumber = screen.getByText('# TASK-101');

    expect(taskNumber).toBeDefined();
    expect(taskNumber.getAttribute('data-task-card-copy-trigger')).toBe('true');
    expect(taskNumber.getAttribute('data-clipboard-text')).toBe('TASK-101');
    expect(ClipboardJS).toHaveBeenCalled();

    fireEvent.click(taskNumber);
    clipboardMockState.handlers.success?.();

    await waitFor(() => {
      expect(successMock).toHaveBeenCalledWith('任务编号已复制');
    });
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('任务编号复制失败时给出错误提示', async () => {
    const errorMock = vi.spyOn(message, 'error').mockImplementation(() => {
      return undefined as never;
    });

    render(<TaskCard task={baseTask} />);

    fireEvent.click(screen.getByText('# TASK-101'));
    clipboardMockState.handlers.error?.();

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
});
