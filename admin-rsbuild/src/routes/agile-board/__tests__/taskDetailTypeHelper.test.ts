import { describe, expect, it } from 'vitest';

import {
  buildTaskDetailTypeMenuItems,
  resolveTaskDetailTypeText,
} from '../#taskDetailTypeHelper';

describe('taskDetailTypeHelper', () => {
  it('优先使用任务详情自带的类型名称', () => {
    const text = resolveTaskDetailTypeText(
      {
        typeId: 11,
        typeName: '需求',
      },
      [
        {
          id: 11,
          name: '任务',
          sort: 1,
        },
      ],
    );

    expect(text).toBe('需求');
  });

  it('当当前类型已被删除时，会把历史类型插回菜单顶部', () => {
    const items = buildTaskDetailTypeMenuItems(
      {
        typeId: 99,
        typeName: '旧类型',
      },
      [
        {
          id: 1,
          name: '需求',
          sort: 1,
        },
        {
          id: 2,
          name: '缺陷',
          sort: 2,
        },
      ],
    );

    expect(items[0]).toEqual({
      key: '99',
      label: '旧类型（历史类型）',
    });
    expect(items[1]).toEqual({
      key: '1',
      label: '需求',
    });
  });
});
