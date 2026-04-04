import { describe, expect, it, vi } from 'vitest';

import type { ProjectTaskDetail } from '@/api/modules/project-task.types';

import { handleBoardTitleSearch } from '../#helper';

const taskDetail: ProjectTaskDetail = {
  id: 1201,
  projectId: 10,
  title: '搜索任务',
  status: 'todo',
  priority: 'medium',
};

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

  it('编号搜索失败后回退为标题搜索', async () => {
    const getDetailByCode = vi.fn().mockRejectedValue(new Error('not-found'));
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
});
