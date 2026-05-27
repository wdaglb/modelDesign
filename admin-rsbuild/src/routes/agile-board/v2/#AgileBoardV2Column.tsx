import { Empty } from 'antd';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { memo } from 'react';
import type { ProjectTaskType } from '@/api/modules/project-task-type';
import { TaskPriorityLabel } from '@/api/modules/project-task.types';
import useAuthStore from '@/store/auth.ts';
import {
  getColumnDragId,
  getColumnSubtitle,
  getTaskAssigneeText,
  getTaskDueTimeText,
  getTaskDragId,
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
  disabled?: boolean;
  onOpenSubtasks: (task: AgileBoardTask) => Promise<void>;
  onPreview: (task: AgileBoardTask) => Promise<void>;
  tasks: AgileBoardTask[];
  taskTypes?: ProjectTaskType[];
}

interface AgileBoardV2TaskCardBodyProps {
  accentColor: string;
  currentGitUsername?: string;
  onOpenSubtasks?: (task: AgileBoardTask) => Promise<void>;
  onPreview?: (task: AgileBoardTask) => Promise<void>;
  showSubtaskAction: boolean;
  task: AgileBoardTask;
  taskTypes?: ProjectTaskType[];
}

interface AgileBoardV2TaskCardButtonProps
  extends AgileBoardV2TaskCardBodyProps {
  disabled?: boolean;
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
 * 轻量任务卡片主体。
 *
 * @param props 卡片主体渲染参数
 * @returns v2 卡片内容
 */
function AgileBoardV2TaskCardBody(props: AgileBoardV2TaskCardBodyProps) {
  const priorityColor = getBoardPriorityAccentColor(props.task.priority);
  const childTaskCount = props.task.childTaskCount ?? 0;
  const taskBranchName = resolveTaskBranchName(
    props.task,
    props.currentGitUsername,
    props.taskTypes,
  );
  const taskBranchUnavailableMessage = getTaskBranchUnavailableMessage(
    resolveTaskBranchUnavailableReason(
      props.task,
      props.currentGitUsername,
      props.taskTypes,
    ),
  );
  let subtaskActionNode: ReactNode = null;

  if (props.showSubtaskAction && props.onOpenSubtasks) {
    if (shouldShowSubtaskAction(props.task)) {
      subtaskActionNode = (
        <V2TaskSubtaskButton
          type="button"
          $accentColor={props.accentColor}
          onClick={async (event) => {
            event.stopPropagation();
            await props.onOpenSubtasks?.(props.task);
          }}
        >
          查看子任务（{childTaskCount}）
        </V2TaskSubtaskButton>
      );
    }
  }

  return (
    <>
      <V2TaskCardTop>
        <V2TaskCode $accentColor={props.accentColor}>
          {resolveTaskNumberText(props.task)}
        </V2TaskCode>
        <V2PriorityTag $color={priorityColor}>
          {TaskPriorityLabel[props.task.priority]}
        </V2PriorityTag>
      </V2TaskCardTop>

      <V2TaskTitleRow>
        <V2TaskTypeTag>{resolveTaskTypeText(props.task)}</V2TaskTypeTag>
        <V2TaskTitle level={5}>{props.task.title}</V2TaskTitle>
      </V2TaskTitleRow>

      <V2TaskMetaGrid>
        <V2TaskMetaItem>
          <V2TaskMetaLabel>项目</V2TaskMetaLabel>
          <V2TaskMetaValue>{getTaskProjectText(props.task)}</V2TaskMetaValue>
        </V2TaskMetaItem>
        <V2TaskMetaItem>
          <V2TaskMetaLabel>分支名</V2TaskMetaLabel>
          <V2TaskMetaValue>
            {taskBranchName || taskBranchUnavailableMessage}
          </V2TaskMetaValue>
        </V2TaskMetaItem>
        <V2TaskMetaItem>
          <V2TaskMetaLabel>负责人</V2TaskMetaLabel>
          <V2TaskMetaValue>{getTaskAssigneeText(props.task)}</V2TaskMetaValue>
        </V2TaskMetaItem>
        <V2TaskMetaItem>
          <V2TaskMetaLabel>截止时间</V2TaskMetaLabel>
          <V2TaskMetaValue>{getTaskDueTimeText(props.task)}</V2TaskMetaValue>
        </V2TaskMetaItem>
        <V2TaskMetaItem>
          <V2TaskMetaLabel>工时</V2TaskMetaLabel>
          <V2TaskMetaValue>{getTaskWorkDaysText(props.task)}</V2TaskMetaValue>
        </V2TaskMetaItem>
      </V2TaskMetaGrid>

      {subtaskActionNode}
    </>
  );
}

/**
 * v2 看板拖拽任务卡片。
 *
 * @param props 卡片渲染参数
 * @returns 具备拖拽语义的轻量卡片
 */
function AgileBoardV2TaskCardButton(props: AgileBoardV2TaskCardButtonProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getTaskDragId(props.task.id),
    disabled: props.disabled,
  });

  return (
    <V2TaskCard
      ref={setNodeRef}
      type="button"
      disabled={props.disabled}
      $accentColor={props.accentColor}
      $isDragging={isDragging}
      data-v2-task-card="true"
      onClick={async () => {
        await props.onPreview?.(props.task);
      }}
      {...attributes}
      {...listeners}
    >
      <AgileBoardV2TaskCardBody
        accentColor={props.accentColor}
        currentGitUsername={props.currentGitUsername}
        onOpenSubtasks={props.onOpenSubtasks}
        showSubtaskAction
        task={props.task}
        taskTypes={props.taskTypes}
      />
    </V2TaskCard>
  );
}

/**
 * v2 看板拖拽浮层卡片。
 *
 * @param props 浮层卡片参数
 * @returns 跟随鼠标的轻量卡片预览
 */
export function AgileBoardV2TaskCardPreview(
  props: Omit<AgileBoardV2TaskCardBodyProps, 'showSubtaskAction'>,
) {
  const currentInfo = useAuthStore((state) => state.currentInfo);
  const currentGitUsername =
    props.currentGitUsername ?? currentInfo?.gitUsername;

  return (
    <V2TaskCard
      as="div"
      $accentColor={props.accentColor}
      $isOverlay
      data-v2-task-card-overlay="true"
    >
      <AgileBoardV2TaskCardBody
        accentColor={props.accentColor}
        currentGitUsername={currentGitUsername}
        showSubtaskAction={false}
        task={props.task}
        taskTypes={props.taskTypes}
      />
    </V2TaskCard>
  );
}

/**
 * 高性能版敏捷面板列容器。
 *
 * 实现原则：
 * - 在保留轻量结构的前提下补回必要的拖拽语义；
 * - 卡片高度固定，列内只保留一个滚动容器；
 * - 所有展示文案都在本层规整，避免把大而全的通用卡片树带入此页面。
 */
const AgileBoardV2Column = memo((props: AgileBoardV2ColumnProps) => {
  const currentInfo = useAuthStore((state) => state.currentInfo);
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnDragId(props.column.status),
    disabled: props.disabled,
  });
  const columnSubtitle = getColumnSubtitle(props.column.isHistory);
  const canDrop = Boolean(isOver && !props.disabled);
  let subtitleNode: ReactNode = null;

  if (columnSubtitle) {
    subtitleNode = (
      <V2ColumnSubtitle type="secondary">{columnSubtitle}</V2ColumnSubtitle>
    );
  }

  return (
    <V2ColumnFrame
      ref={setNodeRef}
      $accentColor={props.column.accentColor}
      $isOver={canDrop}
    >
      <V2ColumnHeader $accentColor={props.column.accentColor}>
        <V2ColumnHeaderTop>
          <V2ColumnTitle level={5} $accentColor={props.column.accentColor}>
            {props.column.title}
          </V2ColumnTitle>
          <V2ColumnCountTag
            $accentColor={props.column.accentColor}
            variant="filled"
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
              description="拖拽任务到这里"
            />
          </V2EmptyState>
        )}

        {props.tasks.length > 0 && (
          <V2TaskList>
            {props.tasks.map((task) => {
              return (
                <AgileBoardV2TaskCardButton
                  key={task.id}
                  accentColor={props.column.accentColor}
                  currentGitUsername={currentInfo?.gitUsername}
                  disabled={props.disabled}
                  onOpenSubtasks={props.onOpenSubtasks}
                  onPreview={props.onPreview}
                  task={task}
                  taskTypes={props.taskTypes}
                />
              );
            })}
          </V2TaskList>
        )}
      </V2ColumnBody>
    </V2ColumnFrame>
  );
});

AgileBoardV2Column.displayName = 'AgileBoardV2Column';

export default AgileBoardV2Column;
