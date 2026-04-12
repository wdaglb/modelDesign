import { useState } from 'react';
import { Button, Typography } from 'antd';
import type { TaskPriority } from '@/api/modules/project-task.types';
import { TaskCard } from '@/components';

import { mapAgileBoardTaskToTaskCardTask } from '../#taskCardAdapter';
import type { AgileBoardTask } from '../#types';
import {
  SubtaskListContent,
  SubtaskListHeader,
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
  const [expanded, setExpanded] = useState(true);
  const subtaskCount = props.subtasks.length;
  let toggleText = '展开子任务';

  if (expanded) {
    toggleText = '收起子任务';
  }

  let contentNode = null;
  if (expanded) {
    contentNode = (
      <SubtaskListContent data-subtask-list="true">
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
      </SubtaskListContent>
    );
  }

  return (
    <SubtaskListRoot>
      <SubtaskListHeader>
        <Typography.Text type="secondary">
          子任务 {subtaskCount} 项
        </Typography.Text>
        <Button
          type="link"
          size="small"
          aria-expanded={expanded}
          data-subtask-toggle="true"
          onClick={() => {
            setExpanded((currentExpanded) => {
              return !currentExpanded;
            });
          }}
        >
          {toggleText}
        </Button>
      </SubtaskListHeader>
      {contentNode}
    </SubtaskListRoot>
  );
};

export default SubtaskList;
