import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import {
  buildTaskDetailSchedulePatch,
  buildTaskDetailScheduleRangeValue,
  mergeTaskDetailScheduleDraft,
  resolveTaskDetailScheduleDraft,
  resolveTaskDetailScheduleDraftFromRange,
} from '../#taskDetailScheduleHelper';

describe('taskDetailScheduleHelper', () => {
  it('任务详情可回填为范围选择器草稿', () => {
    const draft = resolveTaskDetailScheduleDraft({
      startTime: '2026-04-19 09:30:00',
      dueTime: '2026-04-20 18:00:00',
    });

    expect(draft.startTime?.format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2026-04-19 09:30:00',
    );
    expect(draft.dueTime?.format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2026-04-20 18:00:00',
    );
  });

  it('范围值为空时会回落成双空草稿，避免提交脏数据', () => {
    const draft = resolveTaskDetailScheduleDraftFromRange(null);

    expect(draft.startTime).toBeNull();
    expect(draft.dueTime).toBeNull();
  });

  it('范围草稿会保持开始与截止时间顺序', () => {
    const rangeValue = buildTaskDetailScheduleRangeValue({
      startTime: dayjs('2026-04-21 10:00:00'),
      dueTime: dayjs('2026-04-22 20:00:00'),
    });

    expect(rangeValue[0]?.format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2026-04-21 10:00:00',
    );
    expect(rangeValue[1]?.format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2026-04-22 20:00:00',
    );
  });

  it('提交补丁继续输出接口需要的 startTime / dueTime 字段', () => {
    const patch = buildTaskDetailSchedulePatch({
      startTime: dayjs('2026-04-23 08:15:00'),
      dueTime: dayjs('2026-04-24 17:45:00'),
    });

    expect(patch).toEqual({
      startTime: '2026-04-23 08:15:00',
      dueTime: '2026-04-24 17:45:00',
    });
  });

  it('只确认开始时间时保留原有截止时间', () => {
    const draft = mergeTaskDetailScheduleDraft({
      currentDraft: {
        startTime: dayjs('2026-04-19 09:30:00'),
        dueTime: dayjs('2026-04-20 18:00:00'),
      },
      value: [dayjs('2026-04-21 10:00:00'), null],
      changedField: 'start',
    });

    expect(draft.startTime?.format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2026-04-21 10:00:00',
    );
    expect(draft.dueTime?.format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2026-04-20 18:00:00',
    );
  });

  it('只确认截止时间时保留原有开始时间', () => {
    const draft = mergeTaskDetailScheduleDraft({
      currentDraft: {
        startTime: dayjs('2026-04-19 09:30:00'),
        dueTime: dayjs('2026-04-20 18:00:00'),
      },
      value: [null, dayjs('2026-04-22 20:00:00')],
      changedField: 'end',
    });

    expect(draft.startTime?.format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2026-04-19 09:30:00',
    );
    expect(draft.dueTime?.format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2026-04-22 20:00:00',
    );
  });
});
