export const list = () => ['projectList'];

/**
 * 项目详情查询键。
 */
export const detail = (projectId: number) => ['projectDetail', projectId];

/**
 * 项目任务列表查询键。
 */
export const taskList = (projectId?: number) => {
  if (projectId === undefined) {
    return ['projectTaskList'];
  }

  return ['projectTaskList', projectId];
};

/**
 * 敏捷面板任务查询键。
 */
export const taskBoard = () => ['projectTaskBoard'];

/**
 * 任务变更日志查询键。
 */
export const taskChangeLog = (taskId: number) => [
  'projectTaskChangeLog',
  taskId,
];

/**
 * 任务动态查询键。
 */
export const taskDynamic = (taskId: number) => ['projectTaskDynamic', taskId];

/**
 * 子任务列表查询键。
 */
export const taskChildren = (parentTaskId: number) => [
  'projectTaskChildren',
  parentTaskId,
];

/**
 * 子任务批量列表查询键。
 */
export const taskChildrenBatch = (parentTaskIds: number[]) => [
  'projectTaskChildrenBatch',
  normalizeTaskChildrenBatchIds(parentTaskIds),
];

/**
 * 规范化父任务 ID 列表，避免顺序差异导致缓存键不一致。
 */
const normalizeTaskChildrenBatchIds = (parentTaskIds: number[]) => {
  const uniqueIds = Array.from(new Set(parentTaskIds));
  return uniqueIds.sort((left, right) => left - right);
};

/**
 * 按编号任务详情查询键。
 */
export const taskDetailByCode = (code: string) => [
  'projectTaskDetailByCode',
  code,
];

/**
 * 任务状态配置查询键。
 */
export const taskStatusList = () => ['projectTaskStatusList'];
