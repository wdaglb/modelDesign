import { useDraggable } from '@dnd-kit/core';

import { TaskCard } from '@/components';
import { TaskPriority } from '@/api/modules/project-task.types';

import { getTaskDragId } from '../#helper';
import { mapAgileBoardTaskToTaskCardTask } from '../#taskCardAdapter';
import type { AgileBoardTask } from '../#types';
import {
  OverlayTaskCardShell,
  TaskCardShell,
} from '../styles/task-card-shell.styled';

interface AgileBoardTaskCardProps {
  disabled?: boolean;
  onPriorityChange: (
    task: AgileBoardTask,
    priority: TaskPriority,
  ) => Promise<void>;
  onPreview: (task: AgileBoardTask) => Promise<void>;
  task: AgileBoardTask;
}

interface AgileBoardTaskCardPreviewProps {
  task: AgileBoardTask;
}

/**
 * 看板场景任务卡片包装层。
 *
 * 说明：
 * - 拖拽语义仅保留在场景层，通用 TaskCard 不感知 dnd-kit；
 * - 数据经适配层转换后传入通用卡片，减少业务重复渲染逻辑。
 */
const AgileBoardTaskCard = (props: AgileBoardTaskCardProps) => {
  const adaptedTask = mapAgileBoardTaskToTaskCardTask(props.task);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getTaskDragId(props.task.id),
    disabled: props.disabled,
  });

  let dragOpacity = 1;
  if (isDragging) {
    dragOpacity = 0;
  }

  return (
    <TaskCardShell ref={setNodeRef} $opacity={dragOpacity}>
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
};

/**
 * 看板拖拽浮层卡片，复用场景适配数据与通用渲染能力。
 */
export function AgileBoardTaskCardPreview(
  props: AgileBoardTaskCardPreviewProps,
) {
  const adaptedTask = mapAgileBoardTaskToTaskCardTask(props.task);

  return (
    <OverlayTaskCardShell>
      <TaskCard isOverlay task={adaptedTask} />
    </OverlayTaskCardShell>
  );
}

export default AgileBoardTaskCard;
