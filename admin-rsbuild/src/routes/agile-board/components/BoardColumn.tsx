import { Empty } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { TaskPriority } from '@/api/modules/project-task.types';

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
  onPriorityChange: (
    task: AgileBoardTask,
    priority: TaskPriority,
  ) => Promise<void>;
}

/**
 * 敏捷面板列容器。
 */
const AgileBoardColumn = (props: AgileBoardColumnProps) => {
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

          {props.tasks.length > 0 && (
            <TaskList>
              {props.tasks.map((task) => {
                const subtasks = props.subtaskMap.get(task.id) ?? [];
                let subtaskNode: ReactNode = null;

                if (subtasks.length > 0) {
                  subtaskNode = (
                    <SubtaskList
                      disabled={props.disabled}
                      subtasks={subtasks}
                      onPreview={props.onPreview}
                      onPriorityChange={props.onPriorityChange}
                    />
                  );
                }

                return (
                  <TaskItem key={task.id}>
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
              })}
            </TaskList>
          )}
        </ColumnBody>
      </ColumnSurface>
    </ColumnFrame>
  );
};

export default AgileBoardColumn;
