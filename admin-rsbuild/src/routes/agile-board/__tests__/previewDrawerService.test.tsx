import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';

import { openTaskPreviewDrawer } from '../#previewDrawerService';

import type { TaskStatusConfig } from '@/api/modules/project-task-status';

import type { ProjectTaskDetail } from '@/api/modules/project-task.types';

vi.mock('../#TaskPreviewDrawer', () => {
  return {
    default: () => null,
  };
});

/**
 * 预览抽屉服务测试。
 */
describe('openTaskPreviewDrawer', () => {
  it('打开抽屉时使用设计稿宽度并透传关键参数', async () => {
    const drawer = {
      open: vi.fn().mockResolvedValue(undefined),
    };

    const statusConfigs: TaskStatusConfig[] = [
      {
        code: 'todo',
        name: '待处理',
        sort: 1,
        isCompleted: false,
        showInAgileBoard: true,
      },
    ];
    const iterations = [
      {
        id: 1,
        name: '当前迭代',
        startDate: '2026-04-01',
        endDate: '2026-04-15',
        published: true,
      },
    ];

    const onEdit = vi.fn<
      (task: ProjectTaskDetail) => Promise<void>
    >().mockResolvedValue(undefined);
    const onTaskUpdated = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    await openTaskPreviewDrawer(drawer, {
      taskId: 1001,
      iterations,
      statusConfigs,
      initialTabKey: 'subtask',
      onEdit,
      onTaskUpdated,
    });

    expect(drawer.open).toHaveBeenCalledTimes(1);

    const openProps = drawer.open.mock.calls[0]?.[0];
    expect(openProps.title).toBe('任务详情');
    expect(openProps.size).toBe(840);
    expect(openProps.styles).toEqual({
      body: {
        padding: 0,
        height: '100%',
        overflow: 'hidden',
      },
    });

    const drawerChildren = openProps.children as ReactElement;
    expect(drawerChildren.props.taskId).toBe(1001);
    expect(drawerChildren.props.iterations).toBe(iterations);
    expect(drawerChildren.props.statusConfigs).toBe(statusConfigs);
    expect(drawerChildren.props.initialTabKey).toBe('subtask');
    expect(drawerChildren.props.onEdit).toBe(onEdit);
    expect(drawerChildren.props.onTaskUpdated).toBe(onTaskUpdated);
  });
});
