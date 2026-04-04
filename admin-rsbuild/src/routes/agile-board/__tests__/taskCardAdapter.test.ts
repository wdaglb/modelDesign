import { describe, expect, it } from 'vitest';

import { taskChildrenBatch } from '@/constants/queryKey/project';

import type { AgileBoardTask } from '../#types';
import { mapAgileBoardTaskToTaskCardTask } from '../#taskCardAdapter';

describe('mapAgileBoardTaskToTaskCardTask', () => {
  it('默认使用任务 id 作为任务编号', () => {
    const task: AgileBoardTask = {
      id: 2048,
      projectId: 8,
      title: '同步卡片上的任务编号',
      status: 'todo',
      priority: 'medium',
    };

    expect(mapAgileBoardTaskToTaskCardTask(task)).toMatchObject({
      id: 2048,
      taskNumber: '2048',
    });
  });

  it('优先使用 taskNo 作为任务编号', () => {
    const task: AgileBoardTask = {
      id: 9,
      projectId: 1,
      title: '统一编号查询逻辑',
      status: 'todo',
      priority: 'medium',
      taskNo: 'TASK-9',
    };

    expect(mapAgileBoardTaskToTaskCardTask(task).taskNumber).toBe('TASK-9');
  });

  it('taskNo 优先于 taskCode 作为任务编号', () => {
    const task: AgileBoardTask = {
      id: 10,
      projectId: 1,
      title: '编号优先级校验',
      status: 'todo',
      priority: 'medium',
      taskNo: 'TASK-10',
      taskCode: 'TASK-CODE-10',
    };

    expect(mapAgileBoardTaskToTaskCardTask(task).taskNumber).toBe('TASK-10');
  });
});

describe('taskChildrenBatch', () => {
  it('会对父任务 id 去重并排序', () => {
    expect(taskChildrenBatch([3, 1, 3, 2])).toEqual([
      'projectTaskChildrenBatch',
      [1, 2, 3],
    ]);
  });
});
