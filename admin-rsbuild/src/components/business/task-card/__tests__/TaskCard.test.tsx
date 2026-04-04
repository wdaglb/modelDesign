import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';

import TaskCard from '../TaskCard';
import type { TaskCardTask } from '../TaskCard.types';

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

describe('TaskCard', () => {
  it('点击左上角任务编号时复制内容并拦截详情打开', async () => {
    const onPreview = vi.fn();
    const writeTextMock = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    const successMock = vi
      .spyOn(message, 'success')
      .mockImplementation(() => {
        return undefined as never;
      });

    render(<TaskCard task={baseTask} onPreview={onPreview} />);

    const taskNumber = screen.getByText('TASK-101');

    expect(taskNumber).toBeDefined();
    expect(screen.queryByText('任务编号')).toBeNull();
    expect(screen.queryByRole('button', { name: '复制任务编号' })).toBeNull();
    expect(taskNumber.getAttribute('style') ?? '').toContain(
      'text-decoration-line: underline overline',
    );

    fireEvent.click(taskNumber);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('TASK-101');
    });
    await waitFor(() => {
      expect(successMock).toHaveBeenCalledWith('任务编号已复制');
    });
    expect(onPreview).not.toHaveBeenCalled();
  });
});
