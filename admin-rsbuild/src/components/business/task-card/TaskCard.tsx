import { Card, Space, Tooltip, Typography, message } from 'antd';
import type { CSSProperties, MouseEvent } from 'react';

import TaskCardPriorityTag, {
  TASK_CARD_PRIORITY_TRIGGER_SELECTOR,
} from './TaskCardPriorityTag';
import type { TaskCardProps, TaskCardTask } from './TaskCard.types';

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
 * 构建通用任务卡片样式，保持与看板卡片一致的视觉层级。
 */
function getTaskCardStyle(
  isOverlay: boolean | undefined,
  disabled: boolean | undefined,
): CSSProperties {
  let boxShadow = '0 6px 14px rgba(15, 23, 42, 0.08)';
  let cursor = 'pointer';

  if (disabled) {
    cursor = 'default';
  }

  if (isOverlay) {
    boxShadow = '0 16px 30px rgba(15, 23, 42, 0.14)';
    cursor = 'default';
  }

  return {
    width: '100%',
    boxShadow,
    cursor,
    transition: 'box-shadow 0.2s ease',
  };
}

/**
 * 通用任务卡片，提供统一的信息结构与点击交互。
 */
const TaskCard = (props: TaskCardProps) => {
  const cardStyle = getTaskCardStyle(props.isOverlay, props.disabled);
  const rootProps = props.rootProps;

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

  /**
   * 点击编号时执行复制，并阻断事件冒泡，避免误触详情预览。
   */
  const handleCopyTaskNumber = async (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!taskNumberText) {
      return;
    }

    await navigator.clipboard.writeText(taskNumberText);
    message.success('任务编号已复制');
  };

  return (
    <div
      style={{ width: '100%' }}
      {...rootProps}
      onClick={handleMergedRootClick}
    >
      <Card
        size="small"
        hoverable={hoverable}
        style={cardStyle}
        styles={{
          body: {
            padding: 16,
          },
        }}
      >
        <Space
          orientation="vertical"
          size={10}
          style={{ width: '100%' }}
          styles={{ item: { width: '100%' } }}
        >
          <Space
            align="start"
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            {taskNumberText ? (
              <Typography.Text
                data-task-card-copy-trigger="true"
                onClick={handleCopyTaskNumber}
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 12,
                  lineHeight: '18px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily:
                    '"SFMono-Regular", "Cascadia Code", "JetBrains Mono", monospace',
                  textDecorationLine: 'underline overline',
                  cursor: 'copy',
                }}
              >
                {taskNumberText}
              </Typography.Text>
            ) : (
              <Tooltip title={projectText}>
                <Typography.Text
                  type="secondary"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 12,
                    lineHeight: '18px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {projectText}
                </Typography.Text>
              </Tooltip>
            )}

            <div
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <TaskCardPriorityTag
                task={props.task}
                disabled={props.disabled}
                isOverlay={props.isOverlay}
                onPriorityChange={props.onPriorityChange}
              />
            </div>
          </Space>

          <Typography.Text
            strong
            style={{
              display: '-webkit-box',
              minHeight: 44,
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              fontSize: 15,
              lineHeight: '22px',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            {props.task.title}
          </Typography.Text>

          <Space orientation="vertical" size={4}>
            {taskNumberText ? (
              <Tooltip title={projectText}>
                <Typography.Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {projectText}
                </Typography.Text>
              </Tooltip>
            ) : null}

            <Typography.Text
              type="secondary"
              style={{
                fontSize: 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {workDaysText}
            </Typography.Text>

            <Tooltip title={assigneeText}>
              <Typography.Text
                type="secondary"
                style={{
                  fontSize: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {assigneeText}
              </Typography.Text>
            </Tooltip>

            <Tooltip title={dueTimeText}>
              <Typography.Text
                type="secondary"
                style={{
                  fontSize: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {dueTimeText}
              </Typography.Text>
            </Tooltip>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default TaskCard;
