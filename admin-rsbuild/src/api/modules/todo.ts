import request from '@/utils/request';

import type { TodoListParams, TodoPageResponse } from './todo.types';

/**
 * 获取我的待办列表。
 */
export const getList = (params?: TodoListParams): Promise<TodoPageResponse> => {
  return request('/project/task/my-todo', {
    method: 'GET',
    params,
  });
};
