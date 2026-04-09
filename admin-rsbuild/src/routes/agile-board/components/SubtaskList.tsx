import type { TaskPriority } from '@/api/modules/project-task.types';
import { TaskCard } from '@/components';

import { mapAgileBoardTaskToTaskCardTask } from '../#taskCardAdapter';
import type { AgileBoardTask } from '../#types';
import {
  SubtaskItem,
  SubtaskListRoot,
} from '../styles/subtask-list.styled';

interface SubtaskListProps {
  disabled?: boolean;
  subtasks: AgileBoardTask[];
  onPreview: (task: AgileBoardTask) => Promise<void>;
  onPriorityChange: (
    task: AgileBoardTask,
    priority: TaskPriority,
  ) => Promise<void>;
}

/**
 * 子任务列表，仅展示一级子任务。
 */
const SubtaskList = (props: SubtaskListProps) => {
  return (
    <SubtaskListRoot data-subtask-list="true">
      {props.subtasks.map((subtask) => {
        const adaptedTask = mapAgileBoardTaskToTaskCardTask(subtask);

        return (
          <SubtaskItem key={subtask.id}>
            <TaskCard
              task={adaptedTask}
              compact
              isSubtask
              disabled={props.disabled}
              onPreview={async () => {
                await props.onPreview(subtask);
              }}
              onPriorityChange={async (_task, priority) => {
                await props.onPriorityChange(subtask, priority);
              }}
            />
          </SubtaskItem>
        );
      })}
    </SubtaskListRoot>
  );
};

export default SubtaskList;
