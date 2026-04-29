import type { ProjectTaskType } from '@/api/modules/project-task-type';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import {
  buildTaskBranchName,
  normalizeGitBranchPrefixGroup,
  resolveTaskNumberText,
} from './#helper';

interface TaskTypeMenuItem {
  /**
   * 下拉菜单项键值。
   */
  key: string;

  /**
   * 下拉菜单展示文案。
   */
  label: string;
}

/**
 * 分支名不可用原因。
 */
export type TaskBranchUnavailableReason =
  | 'missing_git_username'
  | 'missing_branch_prefix_group'
  | 'missing_task_number';

/**
 * 解析任务类型上的 Git 分支前缀分组。
 *
 * 匹配顺序：
 * 1. 优先按 typeId 精确匹配；
 * 2. 若当前任务缺少 typeId，或 typeId 没有命中当前租户类型列表，
 *    再按 typeName 文案做一次回退匹配。
 *
 * 这样可以兼容部分只返回类型名称、未返回类型 ID 的旧数据，
 * 避免明明已配置前缀却被误判成“未配置”。
 *
 * @param task 当前任务详情
 * @param taskTypes 当前租户可选任务类型
 * @returns 规范化后的前缀分组；未配置时返回 undefined
 */
export function resolveTaskTypeGitBranchPrefixGroup(
  task: Pick<ProjectTaskDetail, 'typeId' | 'typeName'>,
  taskTypes?: ProjectTaskType[],
) {
  if (!taskTypes || taskTypes.length === 0) {
    return undefined;
  }

  if (task.typeId !== undefined && task.typeId !== null) {
    const matchedTaskTypeById = taskTypes.find((item) => {
      return item.id === task.typeId;
    });

    const matchedPrefixGroupById = normalizeGitBranchPrefixGroup(
      matchedTaskTypeById?.gitBranchPrefixGroup,
    );
    if (matchedPrefixGroupById) {
      return matchedPrefixGroupById;
    }
  }

  if (typeof task.typeName !== 'string') {
    return undefined;
  }

  const normalizedTypeName = task.typeName.trim();
  if (!normalizedTypeName) {
    return undefined;
  }

  const matchedTaskTypeByName = taskTypes.find((item) => {
    return item.name.trim() === normalizedTypeName;
  });

  return normalizeGitBranchPrefixGroup(
    matchedTaskTypeByName?.gitBranchPrefixGroup,
  );
}

/**
 * 解析任务详情抽屉中展示的类型文案。
 *
 * 任务详情接口通常会返回 typeName，但历史数据或旧接口缓存下可能缺失。
 * 这里优先复用详情里的文案，再回退到实时类型列表，最后兜底显示类型编号，
 * 避免抽屉头部出现空白标签。
 *
 * @param task 当前任务详情
 * @param taskTypes 当前租户可选任务类型
 * @returns 类型展示文案
 */
export function resolveTaskDetailTypeText(
  task: Pick<ProjectTaskDetail, 'typeId' | 'typeName'>,
  taskTypes?: ProjectTaskType[],
) {
  if (task.typeName) {
    const normalizedTypeName = task.typeName.trim();
    if (normalizedTypeName) {
      return normalizedTypeName;
    }
  }

  if (task.typeId === undefined || task.typeId === null) {
    return '未设置';
  }

  if (taskTypes) {
    const matchedTaskType = taskTypes.find((item) => {
      return item.id === task.typeId;
    });

    if (matchedTaskType && matchedTaskType.name.trim()) {
      return matchedTaskType.name.trim();
    }
  }

  return `类型#${task.typeId}`;
}

/**
 * 组装任务详情抽屉的类型下拉项。
 *
 * 当前任务可能引用一个已经被删除的历史类型。为了保证用户在抽屉里仍能看到
 * 当前值并完成切换，这里会把历史类型插回菜单顶部，而不是让下拉框出现“选中值不存在”。
 *
 * @param task 当前任务详情
 * @param taskTypes 当前租户可选任务类型
 * @returns 下拉菜单项列表
 */
export function buildTaskDetailTypeMenuItems(
  task: Pick<ProjectTaskDetail, 'typeId' | 'typeName'>,
  taskTypes?: ProjectTaskType[],
): TaskTypeMenuItem[] {
  const menuItems: TaskTypeMenuItem[] = [];

  if (taskTypes) {
    taskTypes.forEach((item) => {
      menuItems.push({
        key: String(item.id),
        label: item.name,
      });
    });
  }

  if (task.typeId === undefined || task.typeId === null) {
    return menuItems;
  }

  const currentTypeKey = String(task.typeId);
  const currentTypeExists = menuItems.some((item) => {
    return item.key === currentTypeKey;
  });

  if (currentTypeExists) {
    return menuItems;
  }

  menuItems.unshift({
    key: currentTypeKey,
    label: `${resolveTaskDetailTypeText(task, taskTypes)}（历史类型）`,
  });

  return menuItems;
}

/**
 * 基于任务类型配置、Git 用户名与任务编号，统一生成任务建议分支名。
 *
 * @param task 当前任务详情
 * @param gitUsername 当前登录用户的 Git 用户名
 * @param taskTypes 当前租户可选任务类型
 * @returns 建议分支名；若任务类型未配置前缀则返回 undefined
 */
export function resolveTaskBranchName(
  task: Pick<
    ProjectTaskDetail,
    'id' | 'projectCode' | 'taskNo' | 'taskCode' | 'code' | 'serialNumber' | 'typeId' | 'typeName'
  >,
  gitUsername?: string,
  taskTypes?: ProjectTaskType[],
) {
  return buildTaskBranchName({
    gitBranchPrefixGroup: resolveTaskTypeGitBranchPrefixGroup(task, taskTypes),
    gitUsername,
    taskNumberText: resolveTaskNumberText(task as ProjectTaskDetail),
  });
}

/**
 * 解析任务分支名不可用的具体原因，避免界面把缺 Git 用户名误报成缺前缀。
 *
 * @param task 当前任务详情
 * @param gitUsername 当前登录用户 Git 用户名
 * @param taskTypes 当前租户可选任务类型
 * @returns 不可用原因；可生成时返回 undefined
 */
export function resolveTaskBranchUnavailableReason(
  task: Pick<
    ProjectTaskDetail,
    'id' | 'projectCode' | 'taskNo' | 'taskCode' | 'code' | 'serialNumber' | 'typeId' | 'typeName'
  >,
  gitUsername?: string,
  taskTypes?: ProjectTaskType[],
): TaskBranchUnavailableReason | undefined {
  const taskNumberText = resolveTaskNumberText(task as ProjectTaskDetail);
  if (!taskNumberText) {
    return 'missing_task_number';
  }

  if (typeof gitUsername !== 'string' || !gitUsername.trim()) {
    return 'missing_git_username';
  }

  const prefixGroup = resolveTaskTypeGitBranchPrefixGroup(task, taskTypes);
  if (!prefixGroup) {
    return 'missing_branch_prefix_group';
  }

  return undefined;
}

/**
 * 把分支名不可用原因映射成统一提示文案。
 *
 * @param reason 不可用原因
 * @returns 展示给用户的提示文案
 */
export function getTaskBranchUnavailableMessage(
  reason?: TaskBranchUnavailableReason,
) {
  if (reason === 'missing_git_username') {
    return '请先在个人中心配置 Git 用户名';
  }
  if (reason === 'missing_task_number') {
    return '当前任务缺少可用的任务编号';
  }
  return '当前任务类型未配置分支前缀';
}
