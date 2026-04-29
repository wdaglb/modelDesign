import { Empty } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import {
  memo,
  useCallback,
  type ReactNode,
} from 'react';
import { TaskPriority } from '@/api/modules/project-task.types';

import { getColumnDragId, getColumnSubtitle } from '../#helper';
import type { AgileBoardColumnMeta, AgileBoardTask } from '../#types';
import AgileBoardTaskCard from './AgileBoardTaskCard';
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
  TaskActionButton,
  TaskActionMeta,
  TaskActionRow,
  TaskItem,
  TaskList,
} from '../styles/column.styled';

import type { ProjectTaskType } from '@/api/modules/project-task-type';

interface AgileBoardColumnProps {
  column: AgileBoardColumnMeta;
  disabled?: boolean;
  onOpenSubtasks: (task: AgileBoardTask) => Promise<void>;
  onPreview: (task: AgileBoardTask) => Promise<void>;
  tasks: AgileBoardTask[];
  taskTypes?: ProjectTaskType[];
  onPriorityChange: (
    task: AgileBoardTask,
    priority: TaskPriority,
  ) => Promise<void>;
}

/**
 * 判断当前任务是否需要展示子任务入口。
 *
 * @param task 当前任务
 * @returns 是否展示子任务入口
 */
function shouldShowTaskAction(task: AgileBoardTask) {
  if ((task.childTaskCount ?? 0) > 0) {
    return true;
  }

  return false;
}

/**
 * 敏捷面板列容器。
 */
const AgileBoardColumn = memo((props: AgileBoardColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnDragId(props.column.status),
  });
  const columnSubtitle = getColumnSubtitle(props.column.isHistory);
  const canDrop = Boolean(isOver && !props.disabled);
  let subtitleNode: ReactNode = null;

  if (columnSubtitle) {
    subtitleNode = (
      <ColumnSubtitle type="secondary">{columnSubtitle}</ColumnSubtitle>
    );
  }

  /**
   * 统一渲染单个任务节点，避免完整渲染模式下再拆分多套卡片分支。
   */
  const renderTaskItem = useCallback(
    (task: AgileBoardTask) => {
      const childTaskCount = task.childTaskCount ?? 0;
      let taskActionNode: ReactNode = null;

      if (shouldShowTaskAction(task)) {
        taskActionNode = (
          <TaskActionRow>
            <TaskActionMeta type="secondary">
              子任务 {childTaskCount} 项
            </TaskActionMeta>
            <TaskActionButton
              type="link"
              size="small"
              disabled={props.disabled}
              onClick={async (event) => {
                event.stopPropagation();
                await props.onOpenSubtasks(task);
              }}
            >
              查看子任务
            </TaskActionButton>
          </TaskActionRow>
        );
      }

      return (
        <TaskItem
          key={task.id}
          data-task-item="true"
          data-task-item-id={String(task.id)}
        >
          <AgileBoardTaskCard
            accentColor={props.column.accentColor}
            task={task}
            taskTypes={props.taskTypes}
            disabled={props.disabled}
            onPreview={props.onPreview}
            onPriorityChange={props.onPriorityChange}
          />
          {taskActionNode}
        </TaskItem>
      );
    },
    [
      props.column.accentColor,
      props.disabled,
      props.onOpenSubtasks,
      props.onPreview,
      props.onPriorityChange,
    ],
  );

  let taskListNode: ReactNode = null;

  if (props.tasks.length > 0) {
    /**
     * 改回完整渲染后，让 `TaskList` 重新承担普通 flex 列表职责：
     * 这样列内滚动行为完全交给浏览器原生布局，不再维护可见区间、
     * 占位块和滚动节流状态，避免虚拟列表带来的高度估算误差。
     */
    taskListNode = (
      <TaskList>
        {props.tasks.map((task) => {
          return renderTaskItem(task);
        })}
      </TaskList>
    );
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
        <ColumnBody>
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
