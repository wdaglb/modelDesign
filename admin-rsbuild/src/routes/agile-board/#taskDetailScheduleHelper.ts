import type { Dayjs } from 'dayjs';

import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import {
  formatDateValue,
  parseDateValue,
} from '@/routes/project/components/#projectTaskHelper';

/**
 * 任务详情抽屉里的时间范围草稿值。
 *
 * RangePicker 负责一次性编辑开始时间与截止时间，因此这里用统一结构
 * 维护本地草稿，避免在组件里重复拆解和回填两个字段。
 */
export interface TaskDetailScheduleDraft {
  dueTime: Dayjs | null;
  startTime: Dayjs | null;
}

/**
 * 当前在 RangePicker 中被编辑的时间侧。
 */
export type TaskDetailScheduleRangeField = 'start' | 'end';

/**
 * RangePicker 在抽屉里使用的值类型。
 *
 * 允许单边为空，兼容当前任务只填写开始时间或只填写截止时间的历史数据。
 */
export type TaskDetailScheduleRangeValue = [Dayjs | null, Dayjs | null];

/**
 * 根据任务详情生成时间范围草稿。
 *
 * @param task 当前任务详情
 * @return 供抽屉内 RangePicker 使用的草稿值
 */
export function resolveTaskDetailScheduleDraft(
  task: Pick<ProjectTaskDetail, 'dueTime' | 'startTime'>,
): TaskDetailScheduleDraft {
  return {
    startTime: parseDateValue(task.startTime),
    dueTime: parseDateValue(task.dueTime),
  };
}

/**
 * 将时间范围草稿转换为 RangePicker 需要的值。
 *
 * @param draft 当前草稿
 * @return RangePicker 的 value
 */
export function buildTaskDetailScheduleRangeValue(
  draft: TaskDetailScheduleDraft,
): TaskDetailScheduleRangeValue {
  return [draft.startTime, draft.dueTime];
}

/**
 * 将 RangePicker 回传值标准化为草稿对象。
 *
 * @param value RangePicker 当前值
 * @return 标准化后的草稿对象
 */
export function resolveTaskDetailScheduleDraftFromRange(
  value?: TaskDetailScheduleRangeValue | null,
): TaskDetailScheduleDraft {
  let startTime: Dayjs | null = null;
  let dueTime: Dayjs | null = null;

  if (value) {
    if (value[0]) {
      startTime = value[0];
    }

    if (value[1]) {
      dueTime = value[1];
    }
  }

  return {
    startTime,
    dueTime,
  };
}

/**
 * 将 RangePicker 返回值合并到现有草稿中。
 *
 * RangePicker 在只确认开始时间或截止时间时，另一侧可能暂时返回 null。
 * 如果直接整体覆盖，会把未编辑侧误清空，所以这里按“当前编辑侧”
 * 做增量合并，仅在用户明确修改该侧时才覆盖对应字段。
 *
 * @param currentDraft 当前草稿
 * @param value RangePicker 最新返回值
 * @param changedField 当前编辑侧
 * @return 合并后的草稿
 */
export function mergeTaskDetailScheduleDraft(options: {
  changedField?: TaskDetailScheduleRangeField;
  currentDraft: TaskDetailScheduleDraft;
  value?: TaskDetailScheduleRangeValue | null;
}): TaskDetailScheduleDraft {
  const { changedField, currentDraft, value } = options;

  if (value === null) {
    return {
      startTime: null,
      dueTime: null,
    };
  }

  if (!value) {
    return currentDraft;
  }

  if (!changedField) {
    return resolveTaskDetailScheduleDraftFromRange(value);
  }

  let startTime = currentDraft.startTime;
  let dueTime = currentDraft.dueTime;

  if (changedField === 'start') {
    startTime = value[0];
    if (value[1] !== null) {
      dueTime = value[1];
    }
  }

  if (changedField === 'end') {
    dueTime = value[1];
    if (value[0] !== null) {
      startTime = value[0];
    }
  }

  return {
    startTime,
    dueTime,
  };
}

/**
 * 将时间范围草稿转换为接口补丁。
 *
 * @param draft 当前草稿
 * @return 可直接提交给编辑接口的补丁字段
 */
export function buildTaskDetailSchedulePatch(
  draft: TaskDetailScheduleDraft,
) {
  return {
    startTime: formatDateValue(draft.startTime),
    dueTime: formatDateValue(draft.dueTime),
  };
}
