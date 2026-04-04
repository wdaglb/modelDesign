import { describe, expect, it, vi } from 'vitest';
import type { AxiosResponse } from 'axios';

import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import { RequestError } from '@/api/types';

import { handleBoardTitleSearch } from '../#helper';

const taskDetail: ProjectTaskDetail = {
  id: 1201,
  projectId: 10,
  title: '搜索任务',
  status: 'todo',
  priority: 'medium',
};

function buildRequestError(status: number) {
  const response = {
    status,
    data: {
      message: '请求失败',
    },
  } as AxiosResponse;

  return new RequestError(response);
}

describe('handleBoardTitleSearch', () => {
  it('普通标题输入时直接触发标题搜索', async () => {
    const getDetailByCode = vi.fn().mockResolvedValue(taskDetail);
    const onOpenPreview = vi.fn();
    const onFallbackSearch = vi.fn();

    await handleBoardTitleSearch('需求评审流程', {
      getDetailByCode,
      onOpenPreview,
      onFallbackSearch,
    });

    expect(getDetailByCode).not.toHaveBeenCalled();
    expect(onOpenPreview).not.toHaveBeenCalled();
    expect(onFallbackSearch).toHaveBeenCalledWith('需求评审流程');
  });

  it('编号优先搜索命中后直接打开详情', async () => {
    const getDetailByCode = vi.fn().mockResolvedValue(taskDetail);
    const onOpenPreview = vi.fn();
    const onFallbackSearch = vi.fn();

    await handleBoardTitleSearch('TASK-1201', {
      getDetailByCode,
      onOpenPreview,
      onFallbackSearch,
    });

    expect(getDetailByCode).toHaveBeenCalledWith('TASK-1201');
    expect(onOpenPreview).toHaveBeenCalledWith(taskDetail);
    expect(onFallbackSearch).not.toHaveBeenCalled();
  });

  it('多段编号格式按普通标题处理', async () => {
    const getDetailByCode = vi.fn().mockResolvedValue(taskDetail);
    const onOpenPreview = vi.fn();
    const onFallbackSearch = vi.fn();

    await handleBoardTitleSearch('TASK-CODE-10', {
      getDetailByCode,
      onOpenPreview,
      onFallbackSearch,
    });

    expect(getDetailByCode).not.toHaveBeenCalled();
    expect(onOpenPreview).not.toHaveBeenCalled();
    expect(onFallbackSearch).toHaveBeenCalledWith('TASK-CODE-10');
  });

  it('编号搜索失败后回退为标题搜索', async () => {
    const getDetailByCode = vi.fn().mockRejectedValue(buildRequestError(404));
    const onOpenPreview = vi.fn();
    const onFallbackSearch = vi.fn();

    await handleBoardTitleSearch('TASK-404', {
      getDetailByCode,
      onOpenPreview,
      onFallbackSearch,
    });

    expect(getDetailByCode).toHaveBeenCalledWith('TASK-404');
    expect(onOpenPreview).not.toHaveBeenCalled();
    expect(onFallbackSearch).toHaveBeenCalledWith('TASK-404');
  });

  it('非 404 错误时继续抛出', async () => {
    const errors = [buildRequestError(500), new Error('unknown')];

    for (const error of errors) {
      const getDetailByCode = vi.fn().mockRejectedValue(error);
      const onOpenPreview = vi.fn();
      const onFallbackSearch = vi.fn();

      await expect(
        handleBoardTitleSearch('TASK-500', {
          getDetailByCode,
          onOpenPreview,
          onFallbackSearch,
        }),
      ).rejects.toBe(error);

      expect(onOpenPreview).not.toHaveBeenCalled();
      expect(onFallbackSearch).not.toHaveBeenCalled();
    }
  });
});
