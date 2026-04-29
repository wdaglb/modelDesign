import { describe, expect, it } from 'vitest';

import {
  buildTaskDetailTypeMenuItems,
  resolveTaskBranchName,
  resolveTaskDetailTypeText,
  resolveTaskTypeGitBranchPrefixGroup,
} from '../#taskDetailTypeHelper';

const taskTypes = [
  {
    id: 11,
    name: '需求',
    sort: 1,
    gitBranchPrefixGroup: 'feat',
  },
  {
    id: 12,
    name: '缺陷',
    sort: 2,
    gitBranchPrefixGroup: 'bugfix',
  },
];

describe('taskDetailTypeHelper', () => {
  it('优先使用任务详情自带的类型名称', () => {
    const text = resolveTaskDetailTypeText(
      {
        typeId: 11,
        typeName: '需求',
      },
      taskTypes,
    );

    expect(text).toBe('需求');
  });

  it('当当前类型已被删除时，会把历史类型插回菜单顶部', () => {
    const items = buildTaskDetailTypeMenuItems(
      {
        typeId: 99,
        typeName: '旧类型',
      },
      taskTypes,
    );

    expect(items[0]).toEqual({
      key: '99',
      label: '旧类型（历史类型）',
    });
    expect(items[1]).toEqual({
      key: '11',
      label: '需求',
    });
  });

  it('缺少 typeId 时会按 typeName 回退匹配分支前缀分组', () => {
    expect(
      resolveTaskTypeGitBranchPrefixGroup(
        {
          typeName: '缺陷',
        },
        taskTypes,
      ),
    ).toBe('bugfix');
  });

  it('缺少 typeId 但存在 typeName 时仍能生成建议分支名', () => {
    expect(
      resolveTaskBranchName(
        {
          id: 1001,
          projectCode: 'TASK',
          taskNo: 'TASK-1001',
          typeName: '缺陷',
        },
        'alice-dev',
        taskTypes,
      ),
    ).toBe('bugfix/alice-dev/TASK-1001');
  });
});
