import { describe, expect, it, vi } from 'vitest';

import {
  createProjectTaskColumns,
  type ProjectTaskColumnProps,
} from '../#ProjectTaskColumns';

/**
 * 构造列定义测试的最小属性集。
 *
 * 这里不渲染表格，只验证列配置本身，避免把 KTable、请求层和路由上下文
 * 引入到宽度这类纯展示规则的单元测试里。
 *
 * @return 任务列配置需要的默认测试属性
 */
function createDefaultColumnProps(): ProjectTaskColumnProps {
  return {
    canDelete: true,
    canEdit: true,
    editingCell: null,
    memberOptions: [],
    sorter: {},
    onAssigneeSave: vi.fn(),
    onCloseEditingCell: vi.fn(),
    onDelete: vi.fn(),
    onDueTimeSave: vi.fn(),
    onEdit: vi.fn(),
    onPrioritySave: vi.fn(),
    onStartEditCell: vi.fn(),
    onStartTimeSave: vi.fn(),
    onStatusSave: vi.fn(),
  };
}

describe('createProjectTaskColumns', () => {
  it('项目详情任务标题列应保持更宽的展示空间', () => {
    const columns = createProjectTaskColumns(createDefaultColumnProps());
    const titleColumn = columns.find((column) => {
      return column.key === 'title';
    });

    expect(titleColumn).toEqual(
      expect.objectContaining({
        width: 360,
      }),
    );
  });
});
