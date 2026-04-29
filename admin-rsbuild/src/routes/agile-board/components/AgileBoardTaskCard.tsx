import { useDraggable } from '@dnd-kit/core';
import { memo } from 'react';

import { TaskCard } from '@/components';
import type { ProjectTaskType } from '@/api/modules/project-task-type';
import { TaskPriority } from '@/api/modules/project-task.types';
import useAuthStore from '@/store/auth.ts';

import { getTaskDragId } from '../#helper';
import { mapAgileBoardTaskToTaskCardTask } from '../#taskCardAdapter';
import type { AgileBoardTask } from '../#types';
import {
  OverlayTaskCardShell,
  TaskCardShell,
} from '../styles/task-card-shell.styled';

interface AgileBoardTaskCardProps {
  accentColor?: string;
  disabled?: boolean;
  onPriorityChange: (
    task: AgileBoardTask,
    priority: TaskPriority,
  ) => Promise<void>;
  onPreview: (task: AgileBoardTask) => Promise<void>;
  task: AgileBoardTask;
  taskTypes?: ProjectTaskType[];
}

interface AgileBoardTaskCardPreviewProps {
  accentColor?: string;
  task: AgileBoardTask;
  taskTypes?: ProjectTaskType[];
}

/**
 * 看板场景任务卡片包装层。
 *
 * 说明：
 * - 拖拽语义仅保留在场景层，通用 TaskCard 不感知 dnd-kit；
 * - 数据经适配层转换后传入通用卡片，减少业务重复渲染逻辑。
 */
const AgileBoardTaskCard = memo((props: AgileBoardTaskCardProps) => {
  const currentInfo = useAuthStore((state) => state.currentInfo);
  const adaptedTask = mapAgileBoardTaskToTaskCardTask(props.task, {
    gitUsername: currentInfo?.gitUsername,
    taskTypes: props.taskTypes,
  });
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getTaskDragId(props.task.id),
    disabled: props.disabled,
  });

  let dragOpacity = 1;
  if (isDragging) {
    dragOpacity = 0;
  }

  return (
    <TaskCardShell
      ref={setNodeRef}
      $accentColor={props.accentColor}
      $disabled={Boolean(props.disabled)}
      $opacity={dragOpacity}
    >
      <TaskCard
        task={adaptedTask}
        disabled={props.disabled}
        onPreview={async () => {
          await props.onPreview(props.task);
        }}
        onPriorityChange={async (_task, priority) => {
          await props.onPriorityChange(props.task, priority);
        }}
        rootProps={{
          ...attributes,
          ...listeners,
        }}
      />
    </TaskCardShell>
  );
});

AgileBoardTaskCard.displayName = 'AgileBoardTaskCard';

/**
 * 看板拖拽浮层卡片，复用场景适配数据与通用渲染能力。
 */
export function AgileBoardTaskCardPreview(
  props: AgileBoardTaskCardPreviewProps,
) {
  const currentInfo = useAuthStore((state) => state.currentInfo);
  const adaptedTask = mapAgileBoardTaskToTaskCardTask(props.task, {
    gitUsername: currentInfo?.gitUsername,
    taskTypes: props.taskTypes,
  });

  return (
    <OverlayTaskCardShell
      $accentColor={props.accentColor}
      $disabled={false}
      $opacity={1}
      $isOverlay
    >
      <TaskCard isOverlay task={adaptedTask} />
    </OverlayTaskCardShell>
  );
}

export default AgileBoardTaskCard;
