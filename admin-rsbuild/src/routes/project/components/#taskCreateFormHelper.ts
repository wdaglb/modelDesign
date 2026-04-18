/**
 * 任务新建表单项目记忆存储键。
 */
export const TASK_CREATE_FORM_PROJECT_STORAGE_KEY =
  'taskCreateForm.lastProjectId';

/**
 * 从本地存储读取最近一次选中的项目 ID。
 */
export function getRememberedProjectIdFromStorage() {
  const rawValue = localStorage.getItem(TASK_CREATE_FORM_PROJECT_STORAGE_KEY);

  if (!rawValue) {
    return undefined;
  }

  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return undefined;
  }

  return parsedValue;
}

/**
 * 保存最近一次选中的项目 ID。
 */
export function saveRememberedProjectIdToStorage(projectId?: number) {
  if (projectId === undefined || projectId === null || projectId <= 0) {
    return;
  }

  localStorage.setItem(
    TASK_CREATE_FORM_PROJECT_STORAGE_KEY,
    String(projectId),
  );
}
