import { Dropdown, Tag, message } from 'antd';
import type { MouseEvent, PointerEvent } from 'react';
import { useMemo, useState } from 'react';

import {
  TaskPriority,
  TaskPriorityLabel,
  TaskPriorityOptions,
} from '@/api/modules/project-task.types';
import Icons from '@/icons';

import type { TaskCardPriorityTagProps } from './TaskCard.types';

export const TASK_CARD_PRIORITY_TRIGGER_ATTR = 'data-task-card-priority-trigger';
export const TASK_CARD_PRIORITY_TRIGGER_SELECTOR = `[${TASK_CARD_PRIORITY_TRIGGER_ATTR}="true"]`;

/**
 * 获取任务卡片优先级强调色。
 */
export function getTaskCardPriorityAccentColor(priority: TaskPriority) {
  if (priority === TaskPriority.High) {
    return '#dc2626';
  }

  if (priority === TaskPriority.Medium) {
    return '#d97706';
  }

  return '#2563eb';
}

/**
 * 判断下拉选项 key 是否为合法任务优先级。
 */
function isTaskPriority(value: string): value is TaskPriority {
  if (value === TaskPriority.High) {
    return true;
  }

  if (value === TaskPriority.Medium) {
    return true;
  }

  if (value === TaskPriority.Low) {
    return true;
  }

  return false;
}

/**
 * 任务卡片优先级标签。
 */
const TaskCardPriorityTag = (props: TaskCardPriorityTagProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = useMemo(() => {
    return TaskPriorityOptions.map((item) => {
      return {
        key: item.value,
        label: item.label,
      };
    });
  }, []);

  /**
   * 阻断优先级区域的鼠标事件冒泡，避免触发卡片预览。
   */
  const stopPriorityMouseEvent = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  /**
   * 阻断优先级区域的指针事件冒泡，避免触发卡片预览。
   */
  const stopPriorityPointerEvent = (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  let triggerCursor = 'pointer';
  let showDropdownArrow = true;

  if (props.disabled || props.isOverlay || !props.onPriorityChange) {
    triggerCursor = 'default';
    showDropdownArrow = false;
  }

  const priorityColor = getTaskCardPriorityAccentColor(props.task.priority);

  let arrowNode = null;
  if (showDropdownArrow) {
    arrowNode = (
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
    );
  }

  const triggerNode = (
    <Tag
      bordered
      style={{
        cursor: triggerCursor,
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
          background: priorityColor,
        }}
      />
      <span
        style={{
          color: priorityColor,
        }}
      >
        {TaskPriorityLabel[props.task.priority]}
      </span>
      {arrowNode}
    </Tag>
  );

  if (props.disabled || props.isOverlay || !props.onPriorityChange) {
    return triggerNode;
  }

  return (
    <Dropdown
      open={menuOpen}
      trigger={['click']}
      menu={{
        items: menuItems,
        selectable: true,
        selectedKeys: [props.task.priority],
        onClick: async ({ key, domEvent }) => {
          domEvent.preventDefault();
          domEvent.stopPropagation();
          setMenuOpen(false);

          const nextPriority = String(key);
          if (!isTaskPriority(nextPriority)) {
            return;
          }

          if (nextPriority === props.task.priority) {
            return;
          }

          if (!props.onPriorityChange) {
            return;
          }

          try {
            await props.onPriorityChange(props.task, nextPriority);
          } catch {
            /**
             * 在通用卡片层提供失败反馈，避免调用方未处理异常时出现静默失败。
             */
            message.error('优先级更新失败，请稍后重试');
            return;
          }
        },
      }}
      onOpenChange={(open) => {
        setMenuOpen(open);
      }}
    >
      <span
        style={{ display: 'inline-flex' }}
        data-task-card-priority-trigger="true"
        onDoubleClick={stopPriorityMouseEvent}
        onMouseDown={stopPriorityMouseEvent}
        onPointerDown={stopPriorityPointerEvent}
      >
        {triggerNode}
      </span>
    </Dropdown>
  );
};

export default TaskCardPriorityTag;
