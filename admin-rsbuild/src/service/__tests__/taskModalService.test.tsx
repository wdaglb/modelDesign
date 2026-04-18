import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { openTaskModal } from '../taskModalService';

import type { ProjectTaskDetail } from '@/api/modules/project-task.types';

vi.mock('@/routes/project/components/#TaskCreateForm', () => {
  function TaskCreateFormMock(props: object) {
    return <div data-testid={'task-create-form'} data-props={JSON.stringify(props)} />;
  }

  return {
    default: TaskCreateFormMock,
  };
});

vi.mock('@/routes/project/components/#TaskEditForm', () => {
  function TaskEditFormMock(props: object) {
    return <div data-testid={'task-edit-form'} data-props={JSON.stringify(props)} />;
  }

  return {
    default: TaskEditFormMock,
  };
});

const task: ProjectTaskDetail = {
  id: 1001,
  projectId: 88,
  projectCode: 'TASK',
  taskNo: 'TASK-1001',
  title: '测试任务',
  status: 'todo',
  priority: 'high',
};

describe('openTaskModal', () => {
  it('新建任务时应渲染 TaskCreateForm', async () => {
    const modal = {
      open: vi.fn().mockResolvedValue(undefined),
    };

    await openTaskModal(modal);

    expect(modal.open).toHaveBeenCalledTimes(1);
    const openProps = modal.open.mock.calls[0]?.[0];
    const children = openProps.children as ReactElement;

    expect(openProps.title).toBe('新建任务');
    expect(children.type.name).toBe('TaskCreateForm');
  });

  it('编辑任务时应渲染 TaskEditForm', async () => {
    const modal = {
      open: vi.fn().mockResolvedValue(undefined),
    };

    await openTaskModal(modal, { task });

    expect(modal.open).toHaveBeenCalledTimes(1);
    const openProps = modal.open.mock.calls[0]?.[0];
    const children = openProps.children as ReactElement;

    expect(openProps.title).toBe('编辑任务');
    expect(children.type.name).toBe('TaskEditForm');
  });
});
