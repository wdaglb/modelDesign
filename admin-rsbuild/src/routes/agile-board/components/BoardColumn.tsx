import { Empty } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  TaskPriority,
  type TaskStatusCode,
} from '@/api/modules/project-task.types';

import { getColumnDragId, getColumnSubtitle } from '../#helper';
import type { AgileBoardColumnMeta, AgileBoardTask } from '../#types';
import AgileBoardTaskCard from './AgileBoardTaskCard';
import SubtaskList from './SubtaskList';
import {
  ColumnBadge,
  ColumnBody,
  ColumnFrame,
  ColumnHeader,
  ColumnHeaderTop,
  ColumnSubtitle,
  ColumnSurface,
  ColumnTitle,
  EmptyDropZone,
  TaskItem,
  TaskList,
} from '../styles/column.styled';

interface AgileBoardColumnProps {
  column: AgileBoardColumnMeta;
  disabled?: boolean;
  onPreview: (task: AgileBoardTask) => Promise<void>;
  tasks: AgileBoardTask[];
  subtaskMap: Map<number, AgileBoardTask[]>;
  completedStatusSet: ReadonlySet<TaskStatusCode>;
  onPriorityChange: (
    task: AgileBoardTask,
    priority: TaskPriority,
  ) => Promise<void>;
}

const TASK_CARD_ESTIMATED_HEIGHT = 124;
const TASK_CARD_GAP = 10;
const TASK_ROW_ESTIMATED_HEIGHT = TASK_CARD_ESTIMATED_HEIGHT + TASK_CARD_GAP;
const TASK_OVERSCAN_COUNT = 4;

/**
 * 敏捷面板列容器。
 */
const AgileBoardColumn = memo((props: AgileBoardColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnDragId(props.column.status),
  });
  const columnSubtitle = getColumnSubtitle(props.column.isHistory);
  const canDrop = Boolean(isOver && !props.disabled);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [bodyHeight, setBodyHeight] = useState(0);
  let subtitleNode: ReactNode = null;

  /**
   * 数据量较小时保持完整渲染，避免引入不必要的计算开销。
   */
  const isVirtualEnabled = props.tasks.length > 40;

  if (columnSubtitle) {
    subtitleNode = (
      <ColumnSubtitle type="secondary">{columnSubtitle}</ColumnSubtitle>
    );
  }

  /**
   * 统一渲染单个任务节点，便于普通渲染和虚拟渲染复用。
   */
  const renderTaskItem = useCallback(
    (task: AgileBoardTask) => {
      const subtasks = props.subtaskMap.get(task.id) ?? [];
      let subtaskNode: ReactNode = null;

      if (subtasks.length > 0) {
        subtaskNode = (
          <SubtaskList
            disabled={props.disabled}
            subtasks={subtasks}
            completedStatusSet={props.completedStatusSet}
            onPreview={props.onPreview}
            onPriorityChange={props.onPriorityChange}
          />
        );
      }

      return (
        <TaskItem key={task.id} data-task-item="true">
          <AgileBoardTaskCard
            accentColor={props.column.accentColor}
            task={task}
            disabled={props.disabled}
            onPreview={props.onPreview}
            onPriorityChange={props.onPriorityChange}
          />
          {subtaskNode}
        </TaskItem>
      );
    },
    [
      props.column.accentColor,
      props.disabled,
      props.onPreview,
      props.onPriorityChange,
      props.subtaskMap,
      props.completedStatusSet,
    ],
  );

  /**
   * 监听列滚动容器高度，计算虚拟窗口大小。
   */
  useEffect(() => {
    if (!isVirtualEnabled) {
      return;
    }

    const container = bodyRef.current;

    if (!container) {
      return;
    }

    const updateBodyHeight = () => {
      setBodyHeight(container.clientHeight);
    };

    updateBodyHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateBodyHeight();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isVirtualEnabled]);

  /**
   * 切换到非虚拟模式时重置滚动状态，防止残留偏移。
   */
  useEffect(() => {
    if (isVirtualEnabled) {
      return;
    }

    setScrollTop(0);
    setBodyHeight(0);
  }, [isVirtualEnabled]);

  /**
   * 列滚动事件。
   */
  const handleBodyScroll = useCallback(() => {
    if (!isVirtualEnabled) {
      return;
    }

    const container = bodyRef.current;

    if (!container) {
      return;
    }

    setScrollTop(container.scrollTop);
  }, [isVirtualEnabled]);

  /**
   * 根据当前滚动位置计算可见区间与上下占位高度。
   */
  const visibleRange = useMemo(() => {
    const fallback = {
      startIndex: 0,
      endIndex: props.tasks.length,
      topPlaceholderHeight: 0,
      bottomPlaceholderHeight: 0,
    };

    if (!isVirtualEnabled || bodyHeight <= 0) {
      return fallback;
    }

    const visibleCount = Math.ceil(bodyHeight / TASK_ROW_ESTIMATED_HEIGHT);
    const visibleStart = Math.floor(scrollTop / TASK_ROW_ESTIMATED_HEIGHT);
    const startIndex = Math.max(0, visibleStart - TASK_OVERSCAN_COUNT);
    const endIndex = Math.min(
      props.tasks.length,
      visibleStart + visibleCount + TASK_OVERSCAN_COUNT,
    );
    const topPlaceholderHeight = startIndex * TASK_ROW_ESTIMATED_HEIGHT;
    const bottomPlaceholderHeight =
      (props.tasks.length - endIndex) * TASK_ROW_ESTIMATED_HEIGHT;

    return {
      startIndex,
      endIndex,
      topPlaceholderHeight,
      bottomPlaceholderHeight,
    };
  }, [bodyHeight, isVirtualEnabled, props.tasks.length, scrollTop]);

  /**
   * 按可见区间裁剪任务列表，减少大数据量下的渲染节点数。
   */
  const visibleTasks = useMemo(() => {
    if (!isVirtualEnabled) {
      return props.tasks;
    }

    return props.tasks.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [isVirtualEnabled, props.tasks, visibleRange.endIndex, visibleRange.startIndex]);

  let taskListNode: ReactNode = null;

  if (props.tasks.length > 0) {
    if (isVirtualEnabled) {
      taskListNode = (
        <TaskList data-virtualized="true">
          {visibleRange.topPlaceholderHeight > 0 && (
            <TaskItem
              aria-hidden="true"
              style={{
                height: visibleRange.topPlaceholderHeight,
              }}
            />
          )}
          {visibleTasks.map((task) => {
            return renderTaskItem(task);
          })}
          {visibleRange.bottomPlaceholderHeight > 0 && (
            <TaskItem
              aria-hidden="true"
              style={{
                height: visibleRange.bottomPlaceholderHeight,
              }}
            />
          )}
        </TaskList>
      );
    }

    if (!isVirtualEnabled) {
      taskListNode = (
        <TaskList>
          {props.tasks.map((task) => {
            return renderTaskItem(task);
          })}
        </TaskList>
      );
    }
  }

  return (
    <ColumnFrame ref={setNodeRef}>
      <ColumnSurface
        size="small"
        $accentColor={props.column.accentColor}
        $background={props.column.background}
        $isOver={canDrop}
        title={
          <ColumnHeader>
            <ColumnHeaderTop>
              <ColumnTitle level={5} $accentColor={props.column.accentColor}>
                {props.column.title}
              </ColumnTitle>
              <ColumnBadge
                count={props.tasks.length}
                color={props.column.accentColor}
              />
            </ColumnHeaderTop>
            {subtitleNode}
          </ColumnHeader>
        }
      >
        <ColumnBody ref={bodyRef} onScroll={handleBodyScroll}>
          {props.tasks.length === 0 && (
            <EmptyDropZone $accentColor={props.column.accentColor}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="拖拽任务到这里"
              />
            </EmptyDropZone>
          )}

          {taskListNode}
        </ColumnBody>
      </ColumnSurface>
    </ColumnFrame>
  );
});

AgileBoardColumn.displayName = 'AgileBoardColumn';

export default AgileBoardColumn;
