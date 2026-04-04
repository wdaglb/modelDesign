import { describe, expect, it } from 'vitest';

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
});
