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
 * 任务状态配置查询键。
 */
export const taskStatusList = () => ['projectTaskStatusList'];
