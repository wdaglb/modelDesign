import { Space, Tooltip, message } from 'antd';
import type { MouseEvent, PointerEvent, ReactNode } from 'react';

import TaskCardPriorityTag, {
  TASK_CARD_PRIORITY_TRIGGER_SELECTOR,
} from './TaskCardPriorityTag';
import type { TaskCardProps, TaskCardTask } from './TaskCard.types';
import {
  TaskCardContainer,
  TaskCardHeader,
  TaskCardRoot,
  TaskCardStack,
  TaskHeaderText,
  TaskMetaList,
  TaskMetaText,
  TaskNumberLink,
  TaskPrioritySlot,
  TaskTitleText,
} from './TaskCard.styled';

const TASK_CARD_COPY_TRIGGER_SELECTOR = '[data-task-card-copy-trigger="true"]';

/**
 * 任务卡片中项目名称展示文案。
 */
function getTaskProjectText(task: TaskCardTask) {
  if (!task.projectName) {
    return '未命名项目';
  }

  return task.projectName;
}

/**
 * 任务卡片中负责人展示文案。
 */
function getTaskAssigneeText(task: TaskCardTask) {
  if (!task.assignee) {
    return '未分配负责人';
  }

  return task.assignee;
}

/**
 * 任务卡片中截止时间展示文案。
 */
function getTaskDueTimeText(task: TaskCardTask) {
  if (!task.dueTime) {
    return '未设置截止时间';
  }

  return `截止 ${task.dueTime}`;
}

/**
 * 任务卡片中工时展示文案。
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
 */
function getTaskNumberText(task: TaskCardTask) {
  if (!task.taskNumber) {
    return undefined;
  }

  return task.taskNumber;
}

/**
 * 任务卡片中的任务编号展示文案。
 */
function getTaskNumberDisplayText(task: TaskCardTask) {
  const taskNumberText = getTaskNumberText(task);
  if (!taskNumberText) {
    return undefined;
  }

  return `# ${taskNumberText}`;
}

/**
 * 解析卡片内容间距。
 */
function resolveCardStackSize(isCompact: boolean) {
  if (isCompact) {
    return 8;
  }

  return 10;
}

/**
 * 通用任务卡片，提供统一的信息结构与点击交互。
 */
const TaskCard = (props: TaskCardProps) => {
  const rootProps = props.rootProps;
  const isCompact = Boolean(props.compact || props.isSubtask);
  const shouldHideMeta = Boolean(props.compact) && !props.isSubtask;

  let hoverable = true;
  if (props.isOverlay) {
    hoverable = false;
  }

  /**
   * 处理卡片内部预览点击逻辑。
   */
  const handleInternalRootClick = async (
    event: MouseEvent<HTMLDivElement>,
  ) => {
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
  const dueTimeText = getTaskDueTimeText(props.task);
  const workDaysText = getTaskWorkDaysText(props.task);
  const taskNumberText = getTaskNumberText(props.task);
  const taskNumberDisplayText = getTaskNumberDisplayText(props.task);
  const stackSize = resolveCardStackSize(isCompact);
  const dataAttributes: Record<string, string> = {
    'data-task-card-root': 'true',
  };

  if (props.compact) {
    dataAttributes['data-task-card-compact'] = 'true';
  }

  if (props.isSubtask) {
    dataAttributes['data-task-card-subtask'] = 'true';
  }

  /**
   * 点击编号时执行复制，并阻断事件冒泡，避免误触详情预览。
   */
  const handleCopyTaskNumber = async (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!taskNumberText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(taskNumberText);
      message.success('任务编号已复制');
    } catch {
      message.error('任务编号复制失败，请稍后重试');
    }
  };

  /**
   * 阻断任务编号区域的鼠标事件冒泡，避免触发拖拽。
   */
  const stopTaskNumberMouseEvent = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  /**
   * 阻断任务编号区域的指针事件冒泡，避免触发拖拽。
   */
  const stopTaskNumberPointerEvent = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  let headerLeftNode: ReactNode = null;
  if (taskNumberText && taskNumberDisplayText) {
    headerLeftNode = (
      <TaskNumberLink
        data-task-card-copy-trigger="true"
        onClick={handleCopyTaskNumber}
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

  let metaProjectNode: ReactNode = null;
  if (taskNumberText) {
    metaProjectNode = (
      <Tooltip title={projectText}>
        <TaskMetaText type="secondary">{projectText}</TaskMetaText>
      </Tooltip>
    );
  }

  let metaNode: ReactNode = null;
  if (!shouldHideMeta) {
    metaNode = (
      <TaskMetaList>
        {metaProjectNode}
        <TaskMetaText type="secondary">{workDaysText}</TaskMetaText>
        <Tooltip title={assigneeText}>
          <TaskMetaText type="secondary">{assigneeText}</TaskMetaText>
        </Tooltip>
        <Tooltip title={dueTimeText}>
          <TaskMetaText type="secondary">{dueTimeText}</TaskMetaText>
        </Tooltip>
      </TaskMetaList>
    );
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
      >
        <TaskCardStack
          orientation="vertical"
          size={stackSize}
          styles={{ item: { width: '100%' } }}
        >
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

          <TaskTitleText
            strong
            $compact={Boolean(props.compact)}
            $isSubtask={Boolean(props.isSubtask)}
          >
            {props.task.title}
          </TaskTitleText>

          {metaNode}
        </TaskCardStack>
      </TaskCardContainer>
    </TaskCardRoot>
  );
};

export default TaskCard;
