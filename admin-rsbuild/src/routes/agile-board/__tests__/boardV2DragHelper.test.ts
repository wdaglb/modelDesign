import { describe, expect, it } from 'vitest';
import type { AgileBoardTask } from '@/routes/agile-board/#types';
import {
  buildAgileBoardTaskMap,
  resolveAgileBoardDropChange,
} from '@/routes/agile-board/v2/#boardV2DragHelper';

const baseTask = {
  id: 101,
  projectId: 88,
  title: '支持跨列拖拽切换状态',
  description: '通过拖拽把任务从待处理列移动到进行中列。',
  status: 'todo',
  priority: 'high',
  typeId: 2,
  assignee: '小王',
  dueTime: '2026-04-07',
  projectName: '火星项目',
  workDays: 3,
  taskNo: 'TASK-101',
} as AgileBoardTask;

/**
 * 生成最小任务映射，避免每个用例重复拼装同一批输入。
 *
 * @returns 单任务映射
 */
function createTaskMap() {
  return buildAgileBoardTaskMap([baseTask]);
}

describe('boardV2DragHelper', () => {
  it('跨列拖拽到新状态时返回待提交的状态变更', () => {
    const dropChange = resolveAgileBoardDropChange(
      'task:101',
      'column:inProgress',
      createTaskMap(),
    );

    expect(dropChange).toEqual({
      task: baseTask,
      nextStatus: 'inProgress',
    });
  });

  it('拖回原列时不触发重复状态更新', () => {
    const dropChange = resolveAgileBoardDropChange(
      'task:101',
      'column:todo',
      createTaskMap(),
    );

    expect(dropChange).toBeUndefined();
  });

  it('落点不是列拖拽区域时忽略本次拖拽', () => {
    const dropChange = resolveAgileBoardDropChange(
      'task:101',
      'task:102',
      createTaskMap(),
    );

    expect(dropChange).toBeUndefined();
  });

  it('任务映射中不存在当前拖拽任务时直接放弃更新', () => {
    const dropChange = resolveAgileBoardDropChange(
      'task:999',
      'column:done',
      createTaskMap(),
    );

    expect(dropChange).toBeUndefined();
  });
});
