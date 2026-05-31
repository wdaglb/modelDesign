import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import {
  buildTaskEditInitialValues,
  buildTaskEditPayload,
  getSubmitAssigneeId,
  validateWorkDaysValue,
} from '../#taskEditFormHelper';

import type { ProjectTaskDetail } from '@/api/modules/project-task.types';

const task: ProjectTaskDetail = {
  id: 1001,
  projectId: 88,
  parentTaskId: 77,
  projectCode: 'TASK',
  taskNo: 'TASK-1001',
  title: '原始标题',
  description: '原始说明',
  typeId: 501,
  typeName: '任务',
  iterationId: 12,
  iterationName: '五月迭代',
  status: 'todo',
  priority: 'high',
  assigneeId: 301,
  assignee: '张三',
  workDays: 2,
  startTime: '2026-04-01 10:00:00',
  dueTime: '2026-04-02 18:00:00',
};

describe('taskEditFormHelper', () => {
  it('应生成编辑表单初始值', () => {
    const initialValues = buildTaskEditInitialValues(task);

    expect(initialValues.projectId).toBe(task.projectId);
    expect(initialValues.title).toBe(task.title);
    expect(initialValues.description).toBe(task.description);
    expect(initialValues.typeId).toBe(task.typeId);
    expect(initialValues.iterationId).toBe(task.iterationId);
    expect(initialValues.startTime?.format('YYYY-MM-DD HH:mm:ss')).toBe(
      task.startTime,
    );
  });

  it('应组装统一编辑窗口提交字段', () => {
    const payload = buildTaskEditPayload(
      task,
      {
        projectId: task.projectId,
        title: '新标题',
        description: '新说明',
        iterationId: 13,
        typeId: 502,
        status: 'inProgress',
        priority: 'medium',
        assigneeId: undefined,
        workDays: 3.5,
        startTime: dayjs('2026-05-01 09:00:00'),
        dueTime: dayjs('2026-05-03 18:00:00'),
      },
    );

    expect(payload.startTime).toBe('2026-05-01 09:00:00');
    expect(payload.dueTime).toBe('2026-05-03 18:00:00');
    expect(payload.projectId).toBe(task.projectId);
    expect(payload.parentTaskId).toBe(task.parentTaskId);
    expect(payload.assigneeId).toBe(0);
    expect(payload.iterationId).toBe(13);
    expect(payload.typeId).toBe(502);
  });

  it('未选择排期时应提交空排期', () => {
    const payload = buildTaskEditPayload(
      task,
      {
        projectId: task.projectId,
        title: '新标题',
        description: '新说明',
        iterationId: 14,
        typeId: 503,
        status: 'done',
        priority: 'low',
        assigneeId: 302,
        workDays: 1,
      },
    );

    expect(payload.startTime).toBeUndefined();
    expect(payload.dueTime).toBeUndefined();
    expect(payload.projectId).toBe(task.projectId);
    expect(payload.assigneeId).toBe(302);
    expect(payload.iterationId).toBe(14);
    expect(payload.typeId).toBe(503);
  });

  it('修改项目时应不再回填旧父任务', () => {
    const payload = buildTaskEditPayload(
      task,
      {
        projectId: 99,
        title: '迁移项目',
        description: '迁移项目说明',
        iterationId: 14,
        typeId: 503,
        status: 'todo',
        priority: 'low',
        assigneeId: 302,
        workDays: 1,
      },
    );

    expect(payload.projectId).toBe(99);
    expect(payload.parentTaskId).toBeUndefined();
  });

  it('应校验 0.5 人天步进规则', () => {
    expect(validateWorkDaysValue(undefined)).toBe(true);
    expect(validateWorkDaysValue(1)).toBe(true);
    expect(validateWorkDaysValue(1.5)).toBe(true);
    expect(validateWorkDaysValue(0)).toBe(false);
    expect(validateWorkDaysValue(1.2)).toBe(false);
  });

  it('应把空负责人值转换为 0', () => {
    expect(getSubmitAssigneeId()).toBe(0);
    expect(getSubmitAssigneeId(123)).toBe(123);
  });
});
