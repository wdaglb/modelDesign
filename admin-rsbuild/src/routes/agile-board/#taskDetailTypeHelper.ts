import type { ProjectTaskType } from '@/api/modules/project-task-type';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';

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
