import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import TaskCard, { resolveTaskTypeTagTone } from '../TaskCard';
import type { TaskCardTask } from '../TaskCard.types';

const baseTask: TaskCardTask = {
  id: 101,
  taskNumber: 'TASK-101',
  branchName: 'bugfix/alice-dev/TASK-101',
  projectName: '火星项目',
  typeName: '需求',
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
  it('左上角任务编号使用 Typography copyable 并拦截详情打开', () => {
    const onPreview = vi.fn();
    const { container } = render(
      <TaskCard task={baseTask} onPreview={onPreview} />,
    );

    const taskNumber = screen.getByText('# TASK-101');

    expect(taskNumber).toBeDefined();
    expect(taskNumber.getAttribute('data-task-card-copy-trigger')).toBe('true');
    expect(taskNumber.closest('.ant-typography')).toBeTruthy();
    expect(container.querySelector('.ant-typography-copy')).toBeTruthy();

    fireEvent.click(taskNumber);

    expect(onPreview).not.toHaveBeenCalled();
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

    fireEvent.pointerDown(taskNumber);

    expect(onMouseDown).toHaveBeenCalledTimes(0);
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
    expect(screen.getByText('bugfix/alice-dev/TASK-101')).toBeTruthy();
    expect(screen.getByText('2 人天')).toBeTruthy();
    expect(screen.getByText('小王')).toBeTruthy();
    expect(screen.getByText('截止 2026-04-06')).toBeTruthy();
  });

  it('非紧凑态在标题下方使用灰色弱提示展示最新动态摘要', () => {
    render(<TaskCard task={baseTask} />);

    const titleNode = screen.getByText('补充任务编号展示');
    const dynamicNode = screen.getByText('已补充最新动态摘要展示');

    expect(dynamicNode).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(dynamicNode.className).toContain('ant-typography-secondary');
    expect(titleNode.compareDocumentPosition(dynamicNode)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('紧凑态也在标题下方展示灰色动态摘要且不显示标签', () => {
    render(<TaskCard task={baseTask} compact />);

    const titleNode = screen.getByText('补充任务编号展示');
    const dynamicNode = screen.getByText('已补充最新动态摘要展示');

    expect(dynamicNode).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('最新动态')).toBeNull();
    expect(dynamicNode.className).toContain('ant-typography-secondary');
    expect(titleNode.compareDocumentPosition(dynamicNode)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('标题前会展示任务类型标签', () => {
    render(<TaskCard task={baseTask} />);

    expect(screen.getByText('需求')).toBeTruthy();
    expect(screen.getByText('补充任务编号展示')).toBeTruthy();
  });

  it('任务标题会补充原生 title，便于查看完整文案', () => {
    render(<TaskCard task={baseTask} />);

    const titleNode = screen.getByText('补充任务编号展示');
    const titleElement = titleNode.closest('[title]');

    expect(titleElement).toBeTruthy();
    expect(titleElement?.getAttribute('title')).toBe('补充任务编号展示');
  });

  it('单行标题不再被固定最小高度撑开', () => {
    render(<TaskCard task={baseTask} />);

    const titleNode = screen.getByText('补充任务编号展示');
    const titleStyle = window.getComputedStyle(titleNode);

    expect(titleStyle.minHeight).toBe('');
  });

  it('默认卡片顶部内边距大于左右内边距，保证顶部留白更充足', () => {
    const { container } = render(<TaskCard task={baseTask} />);

    const cardBody = container.querySelector('.ant-card-body');

    expect(cardBody).toBeTruthy();

    if (!cardBody) {
      return;
    }

    const cardBodyStyle = window.getComputedStyle(cardBody);

    expect(cardBodyStyle.paddingTop).toBe('20px');
    expect(cardBodyStyle.paddingRight).toBe('16px');
    expect(cardBodyStyle.paddingBottom).toBe('16px');
    expect(cardBodyStyle.paddingLeft).toBe('16px');
  });

  it('密集态压缩卡片内边距，并保留独立标记便于敏捷面板断言', () => {
    const { container } = render(<TaskCard task={baseTask} dense />);

    const rootNode = container.querySelector('[data-task-card-root="true"]');
    const cardBody = container.querySelector('.ant-card-body');

    expect(rootNode).toBeTruthy();
    expect(cardBody).toBeTruthy();

    if (!rootNode || !cardBody) {
      return;
    }

    const cardBodyStyle = window.getComputedStyle(cardBody);

    expect(rootNode.getAttribute('data-task-card-dense')).toBe('true');
    expect(screen.getByText('火星项目')).toBeTruthy();
    expect(screen.getByText('小王')).toBeTruthy();
    expect(screen.queryByText('bugfix/alice-dev/TASK-101')).toBeNull();
    expect(screen.queryByText('2 人天')).toBeNull();
    expect(screen.queryByText('截止 2026-04-06')).toBeNull();
    expect(cardBodyStyle.paddingTop).toBe('12px');
    expect(cardBodyStyle.paddingRight).toBe('12px');
    expect(cardBodyStyle.paddingBottom).toBe('10px');
    expect(cardBodyStyle.paddingLeft).toBe('12px');
  });

  it('常见类型会映射到固定深色标签', () => {
    expect(resolveTaskTypeTagTone('需求')).toEqual({
      background: '#7c3aed',
      borderColor: '#7c3aed',
      textColor: '#fff',
    });
    expect(resolveTaskTypeTagTone('缺陷')).toEqual({
      background: '#dc2626',
      borderColor: '#dc2626',
      textColor: '#fff',
    });
  });

  it('未知类型会稳定映射到同一组颜色', () => {
    const firstTone = resolveTaskTypeTagTone('架构');
    const secondTone = resolveTaskTypeTagTone('架构');
    const anotherTone = resolveTaskTypeTagTone('联调');

    expect(firstTone).toEqual(secondTone);
    expect(firstTone.textColor).toBe('#fff');
    expect(anotherTone.textColor).toBe('#fff');
  });
});
