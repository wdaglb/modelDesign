export const list = () => ['projectList'];

/**
 * 项目详情查询键。
 */
export const detail = (projectId: number) => ['projectDetail', projectId];

/**
 * 项目任务列表查询键。
 */
export const taskList = (projectId: number) => ['projectTaskList', projectId];
