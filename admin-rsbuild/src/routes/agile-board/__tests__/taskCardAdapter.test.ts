import { describe, expect, it } from 'vitest';

import { taskChildrenBatch } from '@/constants/queryKey/project';

import type { ProjectTaskType } from '@/api/modules/project-task-type';
import type { AgileBoardTask } from '../#types';
import { mapAgileBoardTaskToTaskCardTask } from '../#taskCardAdapter';

const taskTypes: ProjectTaskType[] = [
  {
    id: 2,
    name: '缺陷',
    sort: 1,
    gitBranchPrefixGroup: 'bugfix',
  },
];

describe('mapAgileBoardTaskToTaskCardTask', () => {
  it('存在项目编号时拼接为项目编号加任务 id', () => {
    const task: AgileBoardTask = {
      id: 2048,
      projectId: 8,
      projectCode: 'TASK',
      title: '同步卡片上的任务编号',
      status: 'todo',
      priority: 'medium',
    };

    expect(mapAgileBoardTaskToTaskCardTask(task)).toMatchObject({
      id: 2048,
      taskNumber: 'TASK-2048',
    });
  });

  it('缺少项目编号时回退使用任务 id', () => {
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

  it('敏捷面板卡片映射最新动态摘要并清理空白字符', () => {
    const task: AgileBoardTask = {
      id: 11,
      projectId: 1,
      title: '映射最新动态摘要',
      latestDynamicSummary: '  已完成摘要映射  ',
      status: 'todo',
      priority: 'medium',
    };

    expect(mapAgileBoardTaskToTaskCardTask(task).latestDynamicSummary).toBe(
      '已完成摘要映射',
    );
  });

  it('敏捷面板卡片遇到空白动态摘要时不生成占位', () => {
    const task: AgileBoardTask = {
      id: 15,
      projectId: 1,
      title: '过滤空白动态摘要',
      latestDynamicSummary: '   ',
      status: 'todo',
      priority: 'medium',
    };

    expect(mapAgileBoardTaskToTaskCardTask(task).latestDynamicSummary).toBe(
      undefined,
    );
  });

  it('会映射任务类型名称到卡片结构', () => {
    const task: AgileBoardTask = {
      id: 12,
      projectId: 1,
      title: '映射任务类型',
      typeName: '缺陷',
      status: 'todo',
      priority: 'medium',
    };

    expect(mapAgileBoardTaskToTaskCardTask(task).typeName).toBe('缺陷');
  });

  it('会基于统一 helper 映射建议分支名', () => {
    const task: AgileBoardTask = {
      id: 14,
      projectId: 1,
      title: '映射建议分支名',
      typeId: 2,
      typeName: '缺陷',
      taskNo: 'TASK-14',
      status: 'todo',
      priority: 'medium',
    };

    expect(
      mapAgileBoardTaskToTaskCardTask(task, {
        gitUsername: 'alice-dev',
        taskTypes,
      }).branchName,
    ).toBe('bugfix/alice-dev/TASK-14');
  });

  it('敏捷面板卡片截止时间只保留日期', () => {
    const task: AgileBoardTask = {
      id: 13,
      projectId: 1,
      title: '截止时间裁剪到日期',
      status: 'todo',
      priority: 'medium',
      dueTime: '2026-04-20 18:00:00',
    };

    expect(mapAgileBoardTaskToTaskCardTask(task).dueTime).toBe('2026-04-20');
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
