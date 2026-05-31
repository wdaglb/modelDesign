import { Space, Tooltip, message } from 'antd';
import { type MouseEvent, type PointerEvent, type ReactNode } from 'react';

import { copyTextToClipboard } from '@/utils';

import TaskCardPriorityTag, {
  TASK_CARD_PRIORITY_TRIGGER_SELECTOR,
} from './TaskCardPriorityTag';
import type { TaskCardProps, TaskCardTask } from './TaskCard.types';
import {
  TaskCardContainer,
  TaskDynamicAlert,
  TaskBranchText,
  TaskCardHeader,
  TaskCardRoot,
  TaskCardStack,
  TaskHeaderText,
  TaskMetaList,
  TaskMetaText,
  TaskNumberLink,
  TaskPrioritySlot,
  TaskTitleRow,
  TaskTitleText,
  TaskTypeTag,
} from './TaskCard.styled';

const TASK_CARD_COPY_TRIGGER_SELECTOR = '[data-task-card-copy-trigger="true"]';

interface CopyTaskNumberClickParams {
  event: MouseEvent<HTMLElement>;
  taskNumberText?: string;
}

interface TaskTypeTagTone {
  /**
   * 标签背景色。
   */
  background: string;

  /**
   * 标签边框色。
   */
  borderColor: string;

  /**
   * 标签文字色。
   */
  textColor: string;
}

const TASK_TYPE_TAG_TONE_PALETTE: TaskTypeTagTone[] = [
  {
    background: '#1d4ed8',
    borderColor: '#1d4ed8',
    textColor: '#fff',
  },
  {
    background: '#7c3aed',
    borderColor: '#7c3aed',
    textColor: '#fff',
  },
  {
    background: '#dc2626',
    borderColor: '#dc2626',
    textColor: '#fff',
  },
  {
    background: '#0f766e',
    borderColor: '#0f766e',
    textColor: '#fff',
  },
  {
    background: '#c2410c',
    borderColor: '#c2410c',
    textColor: '#fff',
  },
  {
    background: '#0369a1',
    borderColor: '#0369a1',
    textColor: '#fff',
  },
  {
    background: '#be185d',
    borderColor: '#be185d',
    textColor: '#fff',
  },
  {
    background: '#334155',
    borderColor: '#334155',
    textColor: '#fff',
  },
];

const TASK_TYPE_TAG_TONE_MAP: Record<string, TaskTypeTagTone> = {
  任务: {
    background: '#1d4ed8',
    borderColor: '#1d4ed8',
    textColor: '#fff',
  },
  需求: {
    background: '#7c3aed',
    borderColor: '#7c3aed',
    textColor: '#fff',
  },
  缺陷: {
    background: '#dc2626',
    borderColor: '#dc2626',
    textColor: '#fff',
  },
  优化: {
    background: '#0f766e',
    borderColor: '#0f766e',
    textColor: '#fff',
  },
  测试: {
    background: '#15803d',
    borderColor: '#15803d',
    textColor: '#fff',
  },
  设计: {
    background: '#c2410c',
    borderColor: '#c2410c',
    textColor: '#fff',
  },
};

/**
 * 任务卡片中项目名称展示文案。
 *
 * @param task 当前任务数据
 * @returns 项目名称文案
 */
function getTaskProjectText(task: TaskCardTask) {
  if (!task.projectName) {
    return '未命名项目';
  }

  return task.projectName;
}

/**
 * 任务卡片中负责人展示文案。
 *
 * @param task 当前任务数据
 * @returns 负责人文案
 */
function getTaskAssigneeText(task: TaskCardTask) {
  if (!task.assignee) {
    return '未分配负责人';
  }

  return task.assignee;
}

/**
 * 任务卡片中截止时间展示文案。
 *
 * @param task 当前任务数据
 * @returns 截止时间文案
 */
function getTaskDueTimeText(task: TaskCardTask) {
  if (!task.dueTime) {
    return '未设置截止时间';
  }

  return `截止 ${task.dueTime}`;
}

/**
 * 任务卡片中工时展示文案。
 *
 * @param task 当前任务数据
 * @returns 工时文案
 */
function getTaskWorkDaysText(task: TaskCardTask) {
  if (task.workDays === undefined || task.workDays === null) {
    return '-';
  }

  return `${task.workDays} 人天`;
}

/**
 * 任务卡片中的任务编号文案。
 *
 * 只有业务层显式传入编号时才展示，避免通用卡片在非敏捷面板场景
 * 额外出现无意义的占位信息。
 *
 * @param task 当前任务数据
 * @returns 任务编号
 */
function getTaskNumberText(task: TaskCardTask) {
  if (!task.taskNumber) {
    return undefined;
  }

  return task.taskNumber;
}

/**
 * 任务卡片中的任务编号展示文案。
 *
 * @param task 当前任务数据
 * @returns 带前缀的任务编号文案
 */
function getTaskNumberDisplayText(task: TaskCardTask) {
  const taskNumberText = getTaskNumberText(task);
  if (!taskNumberText) {
    return undefined;
  }

  return `# ${taskNumberText}`;
}

/**
 * 任务卡片中的建议分支名文案。
 *
 * @param task 当前任务数据
 * @returns 规范化后的分支名文案
 */
function getTaskBranchText(task: TaskCardTask) {
  if (!task.branchName) {
    return undefined;
  }

  const normalizedBranchName = task.branchName.trim();
  if (!normalizedBranchName) {
    return undefined;
  }

  return normalizedBranchName;
}

/**
 * 任务卡片中的最新动态摘要。
 *
 * 摘要只做空值规整，具体截断与省略交给样式层统一处理，
 * 这样敏捷面板卡片与其它任务卡片场景可以共用同一份文案。
 *
 * @param task 当前任务数据
 * @returns 动态摘要
 */
function getTaskLatestDynamicSummary(task: TaskCardTask) {
  if (!task.latestDynamicSummary) {
    return undefined;
  }

  const normalizedSummary = task.latestDynamicSummary.trim();
  if (!normalizedSummary) {
    return undefined;
  }

  return normalizedSummary;
}

/**
 * 任务卡片中的类型展示文案。
 *
 * 类型是可选增强信息，仅在业务层明确传入时展示，避免通用卡片在非任务类型场景
 * 下出现空标签或占位文案。
 *
 * @param task 当前任务数据
 * @returns 类型文案
 */
function getTaskTypeText(task: TaskCardTask) {
  if (!task.typeName) {
    return undefined;
  }

  const normalizedTypeName = task.typeName.trim();
  if (!normalizedTypeName) {
    return undefined;
  }

  return normalizedTypeName;
}

/**
 * 计算字符串哈希值，用于把未预设的类型稳定映射到颜色板。
 *
 * @param value 类型名称
 * @returns 非负整数哈希值
 */
function getStableTextHash(value: string) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}

/**
 * 解析任务类型标签配色。
 *
 * 优先对常见业务类型给固定颜色，避免用户频繁看到的标签颜色漂移；
 * 对未知类型则退回到稳定哈希映射，保证同名类型跨卡片展示颜色一致。
 *
 * @param typeName 类型名称
 * @returns 标签配色
 */
export function resolveTaskTypeTagTone(typeName: string): TaskTypeTagTone {
  const normalizedTypeName = typeName.trim();
  const presetTone = TASK_TYPE_TAG_TONE_MAP[normalizedTypeName];

  if (presetTone) {
    return presetTone;
  }

  const hash = getStableTextHash(normalizedTypeName);
  const paletteIndex = hash % TASK_TYPE_TAG_TONE_PALETTE.length;
  const fallbackTone = TASK_TYPE_TAG_TONE_PALETTE[paletteIndex];

  return fallbackTone;
}

/**
 * 解析卡片内容间距。
 *
 * @param isCompact 是否为紧凑模式
 * @param isDense 是否为密集模式
 * @returns 卡片间距
 */
function resolveCardStackSize(isCompact: boolean, isDense: boolean) {
  if (isDense) {
    return 8;
  }

  if (isCompact) {
    return 8;
  }

  return 10;
}

/**
 * 通用任务卡片，提供统一的信息结构与点击交互。
 *
 * @param props 任务卡片属性
 * @returns 任务卡片节点
 */
const TaskCard = (props: TaskCardProps) => {
  const rootProps = props.rootProps;
  const isCompact = Boolean(props.compact || props.isSubtask);
  const isDense = Boolean(props.dense);
  const shouldHideMeta = Boolean(props.compact) && !props.isSubtask;
  /**
   * 仅子任务完成态展示单行删除线，父任务保持原样。
   */
  const isCompletedSubtask = Boolean(props.isSubtask && props.task.isCompleted);

  let hoverable = true;
  if (props.isOverlay) {
    hoverable = false;
  }

  /**
   * 处理卡片内部预览点击逻辑。
   *
   * @param event 点击事件
   * @returns Promise<void>
   */
  const handleInternalRootClick = async (event: MouseEvent<HTMLDivElement>) => {
    if (props.isOverlay) {
      return;
    }

    if (props.disabled) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest(TASK_CARD_PRIORITY_TRIGGER_SELECTOR)) {
      return;
    }

    if (target.closest(TASK_CARD_COPY_TRIGGER_SELECTOR)) {
      return;
    }

    if (!props.onPreview) {
      return;
    }

    await props.onPreview(props.task);
  };

  /**
   * 合并外部 rootProps 点击与组件内部点击逻辑，避免静默覆盖。
   *
   * @param event 点击事件
   * @returns Promise<void>
   */
  const handleMergedRootClick = async (event: MouseEvent<HTMLDivElement>) => {
    if (rootProps && rootProps.onClick) {
      rootProps.onClick(event);
    }

    if (event.defaultPrevented) {
      return;
    }

    await handleInternalRootClick(event);
  };

  const projectText = getTaskProjectText(props.task);
  const assigneeText = getTaskAssigneeText(props.task);
  const taskNumberText = getTaskNumberText(props.task);
  const taskNumberDisplayText = getTaskNumberDisplayText(props.task);
  const taskBranchText = getTaskBranchText(props.task);
  const latestDynamicSummary = getTaskLatestDynamicSummary(props.task);
  const taskTypeText = getTaskTypeText(props.task);
  let taskTypeTone: TaskTypeTagTone | undefined;
  if (taskTypeText) {
    taskTypeTone = resolveTaskTypeTagTone(taskTypeText);
  }
  let taskTypeNode: ReactNode = null;
  if (taskTypeText && taskTypeTone) {
    taskTypeNode = (
      <TaskTypeTag
        $background={taskTypeTone.background}
        $borderColor={taskTypeTone.borderColor}
        $textColor={taskTypeTone.textColor}
      >
        {taskTypeText}
      </TaskTypeTag>
    );
  }
  const stackSize = resolveCardStackSize(isCompact, isDense);
  const dataAttributes: Record<string, string> = {
    'data-task-card-root': 'true',
  };

  if (props.compact) {
    dataAttributes['data-task-card-compact'] = 'true';
  }

  if (props.isSubtask) {
    dataAttributes['data-task-card-subtask'] = 'true';
  }

  if (isCompletedSubtask) {
    dataAttributes['data-task-card-completed-subtask'] = 'true';
  }

  if (isDense) {
    dataAttributes['data-task-card-dense'] = 'true';
  }

  /**
   * 点击任务编号时复制内容并阻断卡片点击事件。
   *
   * @param params 点击参数
   */
  const handleCopyTaskNumberClick = async (
    params: CopyTaskNumberClickParams,
  ) => {
    params.event.preventDefault();
    params.event.stopPropagation();

    if (!params.taskNumberText) {
      return;
    }

    try {
      await copyTextToClipboard(params.taskNumberText);
      message.success('任务编号已复制');
    } catch {
      message.error('任务编号复制失败，请稍后重试');
    }
  };

  /**
   * 阻断任务编号区域的鼠标事件冒泡，避免触发拖拽。
   *
   * @param event 鼠标按下事件
   */
  const stopTaskNumberMouseEvent = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  /**
   * 阻断任务编号区域的指针事件冒泡，避免触发拖拽。
   *
   * @param event 指针按下事件
   */
  const stopTaskNumberPointerEvent = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  let headerLeftNode: ReactNode = null;
  if (taskNumberText && taskNumberDisplayText) {
    headerLeftNode = (
      <TaskNumberLink
        data-task-card-copy-trigger="true"
        onClick={async (event) => {
          await handleCopyTaskNumberClick({
            event,
            taskNumberText,
          });
        }}
        onMouseDown={stopTaskNumberMouseEvent}
        onPointerDown={stopTaskNumberPointerEvent}
      >
        {taskNumberDisplayText}
      </TaskNumberLink>
    );
  } else {
    headerLeftNode = (
      <Tooltip title={projectText}>
        <TaskHeaderText type="secondary">{projectText}</TaskHeaderText>
      </Tooltip>
    );
  }

  let metaNode: ReactNode = null;
  if (!shouldHideMeta) {
    if (isDense) {
      metaNode = (
        <TaskMetaList $dense={isDense}>
          <TaskMetaText type="secondary">{projectText}</TaskMetaText>
          <TaskMetaText type="secondary">{assigneeText}</TaskMetaText>
        </TaskMetaList>
      );
    } else {
      const dueTimeText = getTaskDueTimeText(props.task);
      const workDaysText = getTaskWorkDaysText(props.task);
      let metaProjectNode: ReactNode = null;
      let metaBranchNode: ReactNode = null;

      if (taskNumberText) {
        metaProjectNode = (
          <TaskMetaText type="secondary">{projectText}</TaskMetaText>
        );
      }

      if (taskNumberText && taskBranchText) {
        metaBranchNode = <TaskBranchText>{taskBranchText}</TaskBranchText>;
      }

      metaNode = (
        <TaskMetaList $dense={isDense}>
          {metaProjectNode}
          {metaBranchNode}
          <TaskMetaText type="secondary">{workDaysText}</TaskMetaText>
          <TaskMetaText type="secondary">{assigneeText}</TaskMetaText>
          <TaskMetaText type="secondary">{dueTimeText}</TaskMetaText>
        </TaskMetaList>
      );
    }
  }

  return (
    <TaskCardRoot
      {...rootProps}
      {...dataAttributes}
      onClick={handleMergedRootClick}
    >
      <TaskCardContainer
        size="small"
        hoverable={hoverable}
        $disabled={Boolean(props.disabled)}
        $isOverlay={Boolean(props.isOverlay)}
        $compact={Boolean(props.compact)}
        $isSubtask={Boolean(props.isSubtask)}
        $dense={isDense}
      >
        <TaskCardStack
          orientation="vertical"
          size={stackSize}
          styles={{ item: { width: '100%' } }}
        >
          {latestDynamicSummary ? (
            <TaskDynamicAlert
              type={'warning'}
              showIcon={false}
              message={latestDynamicSummary}
            />
          ) : null}

          <TaskCardHeader>
            {headerLeftNode}
            <TaskPrioritySlot>
              <TaskCardPriorityTag
                task={props.task}
                disabled={props.disabled}
                isOverlay={props.isOverlay}
                onPriorityChange={props.onPriorityChange}
              />
            </TaskPrioritySlot>
          </TaskCardHeader>

          <TaskTitleRow>
            {taskTypeNode}
            <TaskTitleText
              strong
              $compact={Boolean(props.compact)}
              $isSubtask={Boolean(props.isSubtask)}
              $dense={isDense}
              $isCompletedSubtask={isCompletedSubtask}
              title={props.task.title}
            >
              {props.task.title}
            </TaskTitleText>
          </TaskTitleRow>

          {metaNode}
        </TaskCardStack>
      </TaskCardContainer>
    </TaskCardRoot>
  );
};

export default TaskCard;
