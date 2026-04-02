import { useDraggable } from '@dnd-kit/core';
import { Card, Dropdown, Space, Tag, Tooltip, Typography } from 'antd';
import type {
  HTMLAttributes,
  MouseEvent,
  PointerEvent,
} from 'react';
import { useMemo, useState } from 'react';

import {
  TaskPriority,
  TaskPriorityOptions,
} from '@/api/modules/project-task.types';
import Icons from '@/icons';

import {
  getTaskAssigneeText,
  getTaskDueTimeText,
  getTaskDragId,
  getTaskPriorityText,
  getTaskProjectText,
  getTaskWorkDaysText,
  getBoardCardStyle,
  getBoardPriorityAccentColor,
} from './#helper';
import type { AgileBoardTask } from './#types';

interface AgileBoardCardProps {
  disabled?: boolean;
  onPriorityChange: (
    task: AgileBoardTask,
    priority: TaskPriority,
  ) => Promise<void>;
  onPreview: (task: AgileBoardTask) => Promise<void>;
  task: AgileBoardTask;
}

interface AgileBoardCardPreviewProps {
  task: AgileBoardTask;
}

interface AgileBoardCardContainerProps {
  disabled?: boolean;
  isDragging?: boolean;
  isOverlay?: boolean;
  onPriorityChange?: (
    task: AgileBoardTask,
    priority: TaskPriority,
  ) => Promise<void>;
  onPreview?: () => Promise<void>;
  rootProps?: HTMLAttributes<HTMLDivElement>;
  task: AgileBoardTask;
}

const OVERLAY_CARD_WIDTH = 248;
const PRIORITY_TRIGGER_SELECTOR = '[data-agile-board-priority-trigger="true"]';

/**
 * 敏捷面板任务卡片内容。
 */
function AgileBoardCardContainer(props: AgileBoardCardContainerProps) {
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);
  const cardStyle = getBoardCardStyle(
    props.isDragging,
    props.isOverlay,
    props.disabled,
  );

  const priorityMenuItems = useMemo(() => {
    return TaskPriorityOptions.map((item) => {
      return {
        key: item.value,
        label: item.label,
      };
    });
  }, []);

  /**
   * 阻断优先级快捷入口的双击冒泡。
   *
   * @param event 鼠标事件
   */
  const stopPriorityMouseEvent = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  /**
   * 阻断优先级快捷入口的指针冒泡。
   *
   * @param event 指针事件
   */
  const stopPriorityPointerEvent = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  let priorityTriggerCursor = 'pointer';
  if (props.disabled || props.isOverlay || !props.onPriorityChange) {
    priorityTriggerCursor = 'default';
  }

  const priorityTrigger = (
    <Tag
      bordered
      style={{
        cursor: priorityTriggerCursor,
        userSelect: 'none',
        marginInlineEnd: 0,
        paddingInline: 10,
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
      onDoubleClick={stopPriorityMouseEvent}
      onMouseDown={stopPriorityMouseEvent}
      onPointerDown={stopPriorityPointerEvent}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: getBoardPriorityAccentColor(props.task.priority),
        }}
      />
      <span
        style={{
          color: getBoardPriorityAccentColor(props.task.priority),
        }}
      >
        {getTaskPriorityText(props.task.priority)}
      </span>
      {!props.isOverlay && !props.disabled && props.onPriorityChange && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ant-colorTextSecondary)',
            fontSize: 14,
          }}
        >
          <Icons.ChevronDown />
        </span>
      )}
    </Tag>
  );

  let priorityNode = priorityTrigger;
  if (!props.isOverlay && !props.disabled && props.onPriorityChange) {
    priorityNode = (
      <Dropdown
        open={priorityMenuOpen}
        trigger={['click']}
        menu={{
          items: priorityMenuItems,
          selectable: true,
          selectedKeys: [props.task.priority],
          onClick: async ({ key, domEvent }) => {
            domEvent.preventDefault();
            domEvent.stopPropagation();
            setPriorityMenuOpen(false);
            await props.onPriorityChange?.(props.task, key as TaskPriority);
          },
        }}
        onOpenChange={(open) => {
          setPriorityMenuOpen(open);
        }}
      >
        <span
          data-agile-board-priority-trigger="true"
          style={{ display: 'inline-flex' }}
          onDoubleClick={stopPriorityMouseEvent}
          onMouseDown={stopPriorityMouseEvent}
          onPointerDown={stopPriorityPointerEvent}
        >
          {priorityTrigger}
        </span>
      </Dropdown>
    );
  }

  return (
    <div
      style={{ width: '100%' }}
      onClick={async (event) => {
        if (props.disabled) {
          return;
        }

        const target = event.target as HTMLElement;
        if (target.closest(PRIORITY_TRIGGER_SELECTOR)) {
          return;
        }

        if (!props.onPreview) {
          return;
        }

        await props.onPreview();
      }}
      {...props.rootProps}
    >
      <Card
        size="small"
        hoverable={!props.isOverlay}
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
            <Tooltip title={getTaskProjectText(props.task)}>
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
                {getTaskProjectText(props.task)}
              </Typography.Text>
            </Tooltip>

            <div
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {priorityNode}
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
            <Typography.Text
              type="secondary"
              style={{
                fontSize: 12,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {getTaskWorkDaysText(props.task)}
            </Typography.Text>
            <Tooltip title={getTaskAssigneeText(props.task)}>
              <Typography.Text
                type="secondary"
                style={{
                  fontSize: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {getTaskAssigneeText(props.task)}
              </Typography.Text>
            </Tooltip>
            <Tooltip title={getTaskDueTimeText(props.task)}>
              <Typography.Text
                type="secondary"
                style={{
                  fontSize: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {getTaskDueTimeText(props.task)}
              </Typography.Text>
            </Tooltip>
          </Space>
        </Space>
      </Card>
    </div>
  );
}

/**
 * 敏捷面板任务卡片。
 */
const AgileBoardCard = (props: AgileBoardCardProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getTaskDragId(props.task.id),
    disabled: props.disabled,
  });

  return (
    <div ref={setNodeRef} style={{ width: '100%' }}>
      <AgileBoardCardContainer
        disabled={props.disabled}
        isDragging={isDragging}
        onPriorityChange={props.onPriorityChange}
        onPreview={async () => {
          await props.onPreview(props.task);
        }}
        rootProps={{
          ...attributes,
          ...listeners,
        }}
        task={props.task}
      />
    </div>
  );
};

/**
 * 敏捷面板拖拽浮层卡片。
 */
export function AgileBoardCardPreview(props: AgileBoardCardPreviewProps) {
  return (
    <div style={{ width: OVERLAY_CARD_WIDTH }}>
      <AgileBoardCardContainer isOverlay task={props.task} />
    </div>
  );
}

export default AgileBoardCard;
