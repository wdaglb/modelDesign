import type {
  TaskStatusConfig,
  TaskStatusSaveItem,
  TaskStatusSaveParams,
} from '@/api/modules/project-task-status';

const STATUS_CODE_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,31}$/;

/**
 * 前端任务状态编辑项。
 */
export interface EditableTaskStatusItem {
  /**
   * 仅供前端渲染使用的稳定键。
   */
  clientKey: string;

  /**
   * 状态编码。
   */
  code: string;

  /**
   * 状态名称。
   */
  name: string;

  /**
   * 是否为完成状态。
   */
  isCompleted: boolean;
}

/**
 * 生成页面初始化所需的可编辑状态列表。
 *
 * @param statuses 后端返回的状态配置
 * @returns 可直接绑定到表格的前端草稿列表
 */
export function createEditableTaskStatuses(
  statuses: TaskStatusConfig[],
): EditableTaskStatusItem[] {
  return statuses.map((status, index) => {
    return {
      clientKey: `status-${index}-${status.code}`,
      code: status.code,
      name: status.name,
      isCompleted: status.isCompleted,
    };
  });
}

/**
 * 创建一条新的空状态草稿。
 *
 * @param nextId 当前页内自增序号
 * @returns 新增空白行
 */
export function createEmptyTaskStatusItem(
  nextId: number,
): EditableTaskStatusItem {
  return {
    clientKey: `draft-${nextId}`,
    code: '',
    name: '',
    isCompleted: false,
  };
}

/**
 * 把当前草稿转换为后端保存请求。
 *
 * @param items 当前状态草稿列表
 * @returns 整表保存请求
 */
export function buildTaskStatusSaveParams(
  items: EditableTaskStatusItem[],
): TaskStatusSaveParams {
  const statuses: TaskStatusSaveItem[] = items.map((item) => {
    return {
      code: item.code.trim(),
      name: item.name.trim(),
      isCompleted: item.isCompleted,
    };
  });

  return {
    statuses,
  };
}

/**
 * 校验任务状态草稿是否满足前端可快速发现的约束。
 *
 * @param items 当前状态草稿列表
 * @returns 首个校验失败提示；全部通过时返回 undefined
 */
export function validateTaskStatusDrafts(
  items: EditableTaskStatusItem[],
): string | undefined {
  if (items.length === 0) {
    return '请至少保留一个任务状态';
  }

  const duplicatedCodeSet = new Set<string>();
  const duplicatedNameSet = new Set<string>();
  let completedCount = 0;

  for (const item of items) {
    const code = item.code.trim();
    const name = item.name.trim();

    if (!code) {
      return '状态编码不能为空';
    }

    if (!STATUS_CODE_PATTERN.test(code)) {
      return '状态编码需以字母开头，只能包含字母、数字、下划线和短横线';
    }

    if (code.length > 32) {
      return '状态编码长度不能超过 32 个字符';
    }

    if (!name) {
      return '状态名称不能为空';
    }

    if (name.length > 64) {
      return '状态名称长度不能超过 64 个字符';
    }

    const normalizedCode = code.toLowerCase();
    const normalizedName = name.toLowerCase();

    if (duplicatedCodeSet.has(normalizedCode)) {
      return '状态编码不能重复';
    }

    if (duplicatedNameSet.has(normalizedName)) {
      return '状态名称不能重复';
    }

    duplicatedCodeSet.add(normalizedCode);
    duplicatedNameSet.add(normalizedName);

    if (item.isCompleted) {
      completedCount += 1;
    }
  }

  if (completedCount !== 1) {
    return '必须且只能配置一个完成状态';
  }

  return undefined;
}

/**
 * 交换列表中的元素顺序。
 *
 * @param items 原始草稿列表
 * @param fromIndex 当前索引
 * @param toIndex 目标索引
 * @returns 调整顺序后的新列表
 */
export function moveTaskStatusItem(
  items: EditableTaskStatusItem[],
  fromIndex: number,
  toIndex: number,
): EditableTaskStatusItem[] {
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (!movedItem) {
    return items;
  }

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

/**
 * 为脏值检测生成稳定快照。
 *
 * @param items 当前状态草稿列表
 * @returns 仅包含业务字段的序列化字符串
 */
export function serializeTaskStatusDrafts(
  items: EditableTaskStatusItem[],
): string {
  return JSON.stringify(
    items.map((item) => {
      return {
        code: item.code.trim(),
        name: item.name.trim(),
        isCompleted: item.isCompleted,
      };
    }),
  );
}
