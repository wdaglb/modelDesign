import { describe, expect, it } from 'vitest';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import {
  buildTaskStatusSaveParams,
  createEditableTaskStatuses,
  createEmptyTaskStatusItem,
  moveTaskStatusItem,
  serializeTaskStatusDrafts,
  validateTaskStatusDrafts,
} from '@/routes/project/task-status/#taskStatusManagerHelper';

const statusConfigs: TaskStatusConfig[] = [
  {
    code: 'todo',
    name: '待处理',
    sort: 1,
    isCompleted: false,
    showInAgileBoard: true,
  },
  {
    code: 'done',
    name: '已完成',
    sort: 2,
    isCompleted: true,
    showInAgileBoard: true,
  },
];

/**
 * 创建一组可编辑草稿，避免每个用例都手动重复转换。
 *
 * @returns 可编辑草稿列表
 */
function createDrafts() {
  return createEditableTaskStatuses(statusConfigs);
}

describe('taskStatusManagerHelper', () => {
  it('会保留后端顺序并转换为可编辑草稿', () => {
    expect(createDrafts()).toEqual([
      {
        clientKey: 'status-0-todo',
        code: 'todo',
        name: '待处理',
        isCompleted: false,
        showInAgileBoard: true,
      },
      {
        clientKey: 'status-1-done',
        code: 'done',
        name: '已完成',
        isCompleted: true,
        showInAgileBoard: true,
      },
    ]);
  });

  it('会把草稿构造成整表保存请求，并统一去除首尾空格', () => {
    const payload = buildTaskStatusSaveParams([
      {
        clientKey: 'draft-1',
        code: '  todo  ',
        name: ' 待处理 ',
        isCompleted: false,
        showInAgileBoard: false,
      },
    ]);

    expect(payload).toEqual({
      statuses: [
        {
          code: 'todo',
          name: '待处理',
          isCompleted: false,
          showInAgileBoard: false,
        },
      ],
    });
  });

  it('会校验只能存在一个完成状态', () => {
    const validationMessage = validateTaskStatusDrafts([
      {
        clientKey: 'draft-1',
        code: 'todo',
        name: '待处理',
        isCompleted: false,
        showInAgileBoard: true,
      },
      {
        clientKey: 'draft-2',
        code: 'done',
        name: '已完成',
        isCompleted: false,
        showInAgileBoard: true,
      },
    ]);

    expect(validationMessage).toBe('必须且只能配置一个完成状态');
  });

  it('会校验状态编码格式', () => {
    const validationMessage = validateTaskStatusDrafts([
      {
        clientKey: 'draft-1',
        code: '1invalid',
        name: '非法状态',
        isCompleted: true,
        showInAgileBoard: true,
      },
    ]);

    expect(validationMessage).toBe(
      '状态编码需以字母开头，只能包含字母、数字、下划线和短横线',
    );
  });

  it('会按目标索引移动状态顺序', () => {
    const movedDrafts = moveTaskStatusItem(createDrafts(), 1, 0);

    expect(movedDrafts.map((item) => item.code)).toEqual(['done', 'todo']);
  });

  it('越界移动时保持原列表不变', () => {
    const drafts = createDrafts();
    const movedDrafts = moveTaskStatusItem(drafts, 0, -1);

    expect(movedDrafts).toEqual(drafts);
  });

  it('草稿快照只比较业务字段，不比较前端临时键', () => {
    const leftSnapshot = serializeTaskStatusDrafts([
      {
        clientKey: 'draft-1',
        code: 'todo',
        name: '待处理',
        isCompleted: false,
        showInAgileBoard: true,
      },
    ]);
    const rightSnapshot = serializeTaskStatusDrafts([
      {
        clientKey: 'draft-99',
        code: 'todo',
        name: '待处理',
        isCompleted: false,
        showInAgileBoard: true,
      },
    ]);

    expect(leftSnapshot).toBe(rightSnapshot);
  });

  it('草稿快照应包含敏捷面板显示标记', () => {
    const leftSnapshot = serializeTaskStatusDrafts([
      {
        clientKey: 'draft-1',
        code: 'todo',
        name: '待处理',
        isCompleted: false,
        showInAgileBoard: true,
      },
    ]);
    const rightSnapshot = serializeTaskStatusDrafts([
      {
        clientKey: 'draft-1',
        code: 'todo',
        name: '待处理',
        isCompleted: false,
        showInAgileBoard: false,
      },
    ]);

    expect(leftSnapshot).not.toBe(rightSnapshot);
  });

  it('新增空草稿时默认使用未完成状态', () => {
    expect(createEmptyTaskStatusItem(3)).toEqual({
      clientKey: 'draft-3',
      code: '',
      name: '',
      isCompleted: false,
      showInAgileBoard: true,
    });
  });
});
