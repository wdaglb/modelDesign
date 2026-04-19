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
  projectCode: 'TASK',
  taskNo: 'TASK-1001',
  title: '原始标题',
  description: '原始说明',
  typeId: 501,
  typeName: '任务',
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
    expect(initialValues.startTime?.format('YYYY-MM-DD HH:mm:ss')).toBe(
      task.startTime,
    );
  });

  it('drawer 模式应回填开始和截止时间', () => {
    const payload = buildTaskEditPayload(
      task,
      {
        projectId: task.projectId,
        title: '新标题',
        description: '新说明',
        typeId: 502,
        status: 'inProgress',
        priority: 'medium',
        assigneeId: undefined,
        workDays: 3.5,
      },
      'drawer',
    );

    expect(payload.startTime).toBe(task.startTime);
    expect(payload.dueTime).toBe(task.dueTime);
    expect(payload.assigneeId).toBe(0);
    expect(payload.typeId).toBe(502);
  });

  it('full 模式应使用表单中的排期字段', () => {
    const payload = buildTaskEditPayload(
      task,
      {
        projectId: task.projectId,
        title: '新标题',
        description: '新说明',
        typeId: 503,
        status: 'done',
        priority: 'low',
        assigneeId: 302,
        workDays: 1,
        startTime: dayjs('2026-05-01 09:00:00'),
        dueTime: dayjs('2026-05-03 18:00:00'),
      },
      'full',
    );

    expect(payload.startTime).toBe('2026-05-01 09:00:00');
    expect(payload.dueTime).toBe('2026-05-03 18:00:00');
    expect(payload.assigneeId).toBe(302);
    expect(payload.typeId).toBe(503);
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
