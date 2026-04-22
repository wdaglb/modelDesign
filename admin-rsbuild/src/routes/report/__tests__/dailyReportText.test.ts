import { describe, expect, it } from 'vitest';

import type { ProjectTaskReportResponse } from '@/api/modules/project-task-report';

import { buildDailyReportText } from '../#dailyReportText';

describe('buildDailyReportText', () => {
  it('按项目分组并输出指定日报格式', () => {
    const report: ProjectTaskReportResponse = {
      reportType: 'daily',
      reportTitle: '日报（2026-04-23）',
      periodStart: '2026-04-23 00:00:00',
      periodEnd: '2026-04-23 23:59:59',
      tasks: [
        {
          id: 1,
          projectName: '项目1',
          title: '任务1',
          participationRole: '负责人',
          status: 'done',
          priority: 'high',
          updatedAt: '2026-04-23 09:00:00',
        },
        {
          id: 2,
          projectName: '项目1',
          title: '任务2',
          participationRole: '负责人',
          status: 'inProgress',
          priority: 'medium',
          updatedAt: '2026-04-23 10:00:00',
          latestDynamicSummary: '已完成接口联调',
        },
        {
          id: 3,
          projectName: '项目2',
          title: '任务1',
          participationRole: '成员',
          status: 'inProgress',
          priority: 'medium',
          updatedAt: '2026-04-23 11:00:00',
          latestDynamicSummary: '已同步测试结果',
        },
        {
          id: 4,
          projectName: '项目2',
          title: '任务2',
          participationRole: '成员',
          status: 'done',
          priority: 'low',
          updatedAt: '2026-04-23 13:00:00',
          latestDynamicSummary: '这条动态不应出现在完成态后面',
        },
      ],
      dynamics: [],
    };

    expect(buildDailyReportText(report)).toBe(
      [
        '一、项目1',
        '  1. 任务1（完成）',
        '  2. 任务2（进行中，已完成接口联调）',
        '二、项目2',
        '  1. 任务1（进行中，已同步测试结果）',
        '  2. 任务2（完成）',
      ].join('\n'),
    );
  });
});
