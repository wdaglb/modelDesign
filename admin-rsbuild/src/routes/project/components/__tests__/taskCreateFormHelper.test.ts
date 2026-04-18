import { beforeEach, describe, expect, it } from 'vitest';

import {
  getRememberedProjectIdFromStorage,
  saveRememberedProjectIdToStorage,
  TASK_CREATE_FORM_PROJECT_STORAGE_KEY,
} from '../#taskCreateFormHelper';

describe('taskCreateFormHelper', () => {
  beforeEach(() => {
    localStorage.removeItem(TASK_CREATE_FORM_PROJECT_STORAGE_KEY);
  });

  it('应读取已保存的项目 ID', () => {
    localStorage.setItem(TASK_CREATE_FORM_PROJECT_STORAGE_KEY, '123');

    expect(getRememberedProjectIdFromStorage()).toBe(123);
  });

  it('存储值无效时应返回 undefined', () => {
    localStorage.setItem(TASK_CREATE_FORM_PROJECT_STORAGE_KEY, 'invalid');

    expect(getRememberedProjectIdFromStorage()).toBeUndefined();
  });

  it('应保存合法项目 ID', () => {
    saveRememberedProjectIdToStorage(456);

    expect(localStorage.getItem(TASK_CREATE_FORM_PROJECT_STORAGE_KEY)).toBe('456');
  });

  it('应忽略非法项目 ID', () => {
    saveRememberedProjectIdToStorage(0);

    expect(localStorage.getItem(TASK_CREATE_FORM_PROJECT_STORAGE_KEY)).toBeNull();
  });
});
