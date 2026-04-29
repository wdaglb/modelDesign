import { Empty } from 'antd';
import type { ReactNode } from 'react';
import { memo, useCallback } from 'react';
import type { ProjectTaskType } from '@/api/modules/project-task-type';
import { TaskPriorityLabel } from '@/api/modules/project-task.types';
import useAuthStore from '@/store/auth.ts';
import {
  getColumnSubtitle,
  getTaskAssigneeText,
  getTaskDueTimeText,
  getTaskProjectText,
  getTaskWorkDaysText,
  getBoardPriorityAccentColor,
  resolveTaskNumberText,
} from '../#helper';
import {
  getTaskBranchUnavailableMessage,
  resolveTaskBranchName,
  resolveTaskBranchUnavailableReason,
} from '../#taskDetailTypeHelper';
import type { AgileBoardColumnMeta, AgileBoardTask } from '../#types';
import {
  V2ColumnBody,
  V2ColumnCountTag,
  V2ColumnFrame,
  V2ColumnHeader,
  V2ColumnHeaderTop,
  V2ColumnSubtitle,
  V2ColumnTitle,
  V2EmptyState,
  V2PriorityTag,
  V2TaskCard,
  V2TaskCardTop,
  V2TaskCode,
  V2TaskList,
  V2TaskMetaGrid,
  V2TaskMetaItem,
  V2TaskMetaLabel,
  V2TaskMetaValue,
  V2TaskSubtaskButton,
  V2TaskTitle,
  V2TaskTitleRow,
  V2TaskTypeTag,
} from './#board-v2.styled';

interface AgileBoardV2ColumnProps {
  column: AgileBoardColumnMeta;
  onOpenSubtasks: (task: AgileBoardTask) => Promise<void>;
  onPreview: (task: AgileBoardTask) => Promise<void>;
  tasks: AgileBoardTask[];
  taskTypes?: ProjectTaskType[];
}


/**
 * 判断当前任务是否需要展示子任务入口。
 *
 * @param task 当前任务
 * @returns 是否展示子任务入口
 */
function shouldShowSubtaskAction(task: AgileBoardTask) {
  return (task.childTaskCount ?? 0) > 0;
}

/**
 * 解析任务类型展示文案。
 *
 * @param task 当前任务
 * @returns 卡片标题前使用的任务类型文本
 */
function resolveTaskTypeText(task: AgileBoardTask) {
  if (task.typeName) {
    return task.typeName;
  }

  return '任务';
}

/**
 * 高性能版敏捷面板列容器。
 *
 * 实现原则：
 * - 只承担渲染，不引入拖拽与额外交互状态；
 * - 卡片高度固定，列内只保留一个滚动容器；
 * - 所有展示文案都在本层规整，避免把大而全的通用卡片树带入此页面。
 */
const AgileBoardV2Column = memo((props: AgileBoardV2ColumnProps) => {
  const currentInfo = useAuthStore((state) => state.currentInfo);
  const columnSubtitle = getColumnSubtitle(props.column.isHistory);
  let subtitleNode: ReactNode = null;

  if (columnSubtitle) {
    subtitleNode = (
      <V2ColumnSubtitle type="secondary">{columnSubtitle}</V2ColumnSubtitle>
    );
  }

  /**
   * 渲染单个轻量任务卡片。
   */
  const renderTaskCard = useCallback(
    (task: AgileBoardTask) => {
      const priorityColor = getBoardPriorityAccentColor(task.priority);
      const childTaskCount = task.childTaskCount ?? 0;
      const taskBranchName = resolveTaskBranchName(
        task,
        currentInfo?.gitUsername,
        props.taskTypes,
      );
      const taskBranchUnavailableMessage = getTaskBranchUnavailableMessage(
        resolveTaskBranchUnavailableReason(
          task,
          currentInfo?.gitUsername,
          props.taskTypes,
        ),
      );
      let subtaskActionNode: ReactNode = null;

      if (shouldShowSubtaskAction(task)) {
        subtaskActionNode = (
          <V2TaskSubtaskButton
            type="button"
            $accentColor={props.column.accentColor}
            onClick={async (event) => {
              event.stopPropagation();
              await props.onOpenSubtasks(task);
            }}
          >
            查看子任务（{childTaskCount}）
          </V2TaskSubtaskButton>
        );
      }

      return (
        <V2TaskCard
          key={task.id}
          type="button"
          $accentColor={props.column.accentColor}
          data-v2-task-card="true"
          onClick={async () => {
            await props.onPreview(task);
          }}
        >
          <V2TaskCardTop>
            <V2TaskCode $accentColor={props.column.accentColor}>
              {resolveTaskNumberText(task)}
            </V2TaskCode>
            <V2PriorityTag $color={priorityColor}>
              {TaskPriorityLabel[task.priority]}
            </V2PriorityTag>
          </V2TaskCardTop>

          <V2TaskTitleRow>
            <V2TaskTypeTag>{resolveTaskTypeText(task)}</V2TaskTypeTag>
            <V2TaskTitle level={5}>{task.title}</V2TaskTitle>
          </V2TaskTitleRow>

          <V2TaskMetaGrid>
            <V2TaskMetaItem>
              <V2TaskMetaLabel>项目</V2TaskMetaLabel>
              <V2TaskMetaValue>{getTaskProjectText(task)}</V2TaskMetaValue>
            </V2TaskMetaItem>
            <V2TaskMetaItem>
              <V2TaskMetaLabel>分支名</V2TaskMetaLabel>
              <V2TaskMetaValue>
                {taskBranchName || taskBranchUnavailableMessage}
              </V2TaskMetaValue>
            </V2TaskMetaItem>
            <V2TaskMetaItem>
              <V2TaskMetaLabel>负责人</V2TaskMetaLabel>
              <V2TaskMetaValue>{getTaskAssigneeText(task)}</V2TaskMetaValue>
            </V2TaskMetaItem>
            <V2TaskMetaItem>
              <V2TaskMetaLabel>截止时间</V2TaskMetaLabel>
              <V2TaskMetaValue>{getTaskDueTimeText(task)}</V2TaskMetaValue>
            </V2TaskMetaItem>
            <V2TaskMetaItem>
              <V2TaskMetaLabel>工时</V2TaskMetaLabel>
              <V2TaskMetaValue>{getTaskWorkDaysText(task)}</V2TaskMetaValue>
            </V2TaskMetaItem>
          </V2TaskMetaGrid>

          {subtaskActionNode}
        </V2TaskCard>
      );
    },
    [
      currentInfo?.gitUsername,
      props.column.accentColor,
      props.onOpenSubtasks,
      props.onPreview,
      props.taskTypes,
    ],
  );

  return (
    <V2ColumnFrame>
      <V2ColumnHeader $accentColor={props.column.accentColor}>
        <V2ColumnHeaderTop>
          <V2ColumnTitle level={5} $accentColor={props.column.accentColor}>
            {props.column.title}
          </V2ColumnTitle>
          <V2ColumnCountTag
            $accentColor={props.column.accentColor}
            bordered={false}
          >
            {props.tasks.length}
          </V2ColumnCountTag>
        </V2ColumnHeaderTop>
        {subtitleNode}
      </V2ColumnHeader>

      <V2ColumnBody data-v2-column-body="true">
        {props.tasks.length === 0 && (
          <V2EmptyState $accentColor={props.column.accentColor}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="当前列暂无任务"
            />
          </V2EmptyState>
        )}

        {props.tasks.length > 0 && (
          <V2TaskList>{props.tasks.map((task) => renderTaskCard(task))}</V2TaskList>
        )}
      </V2ColumnBody>
    </V2ColumnFrame>
  );
});

AgileBoardV2Column.displayName = 'AgileBoardV2Column';

export default AgileBoardV2Column;
