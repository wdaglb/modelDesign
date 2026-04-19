import { type KeyboardEvent, useRef, useState } from 'react';
import { Alert, Button, Input, Typography } from 'antd';

import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import type { ProjectTaskDetail } from '@/api/modules/project-task.types';
import ProjectTaskAssigneeEditor from '@/routes/project/components/#ProjectTaskAssigneeEditor';
import {
  CellDisplay,
  InlineDateEditor,
  InlineDropdownEditor,
} from '@/routes/project/components/#ProjectTaskInlineEditors';

import {
  buildBoardStatusOptions,
  getBoardStatusText,
  getTaskAssigneeText,
} from './#helper';
import {
  TaskDetailSubtaskCell,
  TaskDetailSubtaskHeadRow,
  TaskDetailSubtaskRow,
  TaskDetailSubtaskTable,
  TaskDetailSubtaskTitleCell,
} from './styles/task-detail-drawer.styled';

export type TaskDetailSubtaskEditableField =
  | 'title'
  | 'status'
  | 'assigneeId'
  | 'dueTime';

export interface TaskDetailSubtaskEditingCell {
  field: TaskDetailSubtaskEditableField;
  taskId: number;
}

interface TaskDetailSubtaskTableProps {
  disabled?: boolean;
  deletingTaskId?: number;
  editingCell: TaskDetailSubtaskEditingCell | null;
  isError: boolean;
  isLoading: boolean;
  items: ProjectTaskDetail[];
  onDelete?: (task: ProjectTaskDetail) => Promise<void>;
  onOpenDetail?: (task: ProjectTaskDetail) => Promise<void>;
  savingCellKey?: string;
  statusConfigs: TaskStatusConfig[];
  onAssigneeSave: (
    task: ProjectTaskDetail,
    value?: string | number,
  ) => Promise<void>;
  onCloseEditingCell: () => void;
  onDueTimeSave: (task: ProjectTaskDetail, value?: string) => Promise<void>;
  onStartEditCell: (
    taskId: number,
    field: TaskDetailSubtaskEditableField,
  ) => void;
  onStatusSave: (
    task: ProjectTaskDetail,
    value?: string | number,
  ) => Promise<void>;
  onTitleSave: (task: ProjectTaskDetail, value: string) => Promise<void>;
}

interface InlineTitleEditorProps {
  disabled?: boolean;
  value: string;
  onCancel: () => void;
  onSave: (value: string) => Promise<void>;
}

/**
 * 子任务标题内联编辑器。
 *
 * 说明：
 * - 回车提交，Esc 取消；
 * - 失焦时若内容发生变化则自动提交，避免用户修改后还要额外点确认。
 */
function InlineTitleEditor(props: InlineTitleEditorProps) {
  const savingByEditorRef = useRef(false);
  const [draftValue, setDraftValue] = useState(props.value);

  const handleSave = async () => {
    const normalizedValue = draftValue.trim();

    if (!normalizedValue) {
      props.onCancel();
      return;
    }

    if (normalizedValue === props.value.trim()) {
      props.onCancel();
      return;
    }

    savingByEditorRef.current = true;
    await props.onSave(normalizedValue);
  };

  const handleBlur = async () => {
    if (savingByEditorRef.current) {
      return;
    }

    await handleSave();
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      props.onCancel();
      return;
    }

    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    await handleSave();
  };

  return (
    <Input
      autoFocus
      size="small"
      variant="borderless"
      disabled={props.disabled}
      value={draftValue}
      maxLength={200}
      style={{ paddingInline: 0 }}
      onChange={(event) => {
        setDraftValue(event.target.value);
      }}
      onBlur={async () => {
        await handleBlur();
      }}
      onKeyDown={async (event) => {
        await handleKeyDown(event);
      }}
    />
  );
}

/**
 * 渲染子任务表格。
 *
 * 统一处理加载态、空态与四个快捷编辑字段，
 * 让任务详情主视图只负责数据获取和保存。
 */
const TaskDetailSubtaskTableSection = (
  props: TaskDetailSubtaskTableProps,
) => {
  const getCellKey = (
    taskId: number,
    field: TaskDetailSubtaskEditableField,
  ) => {
    return `${taskId}:${field}`;
  };

  const isEditingCell = (
    taskId: number,
    field: TaskDetailSubtaskEditableField,
  ) => {
    if (!props.editingCell) {
      return false;
    }

    return (
      props.editingCell.taskId === taskId &&
      props.editingCell.field === field
    );
  };

  const isSavingCell = (
    taskId: number,
    field: TaskDetailSubtaskEditableField,
  ) => {
    return props.savingCellKey === getCellKey(taskId, field);
  };

  if (props.isLoading) {
    return (
      <Typography.Text type={'secondary'}>子任务加载中...</Typography.Text>
    );
  }

  if (props.isError) {
    return (
      <Alert type={'error'} showIcon message={'子任务加载失败，请稍后重试。'} />
    );
  }

  if (!props.items.length) {
    return <Typography.Text type={'secondary'}>暂无子任务</Typography.Text>;
  }

  return (
    <TaskDetailSubtaskTable>
      <TaskDetailSubtaskHeadRow>
        <div>子任务</div>
        <div>状态</div>
        <div>负责人</div>
        <div>截止时间</div>
        <div>操作</div>
      </TaskDetailSubtaskHeadRow>
      {props.items.map((item) => {
        const statusOptions = buildBoardStatusOptions(
          props.statusConfigs,
          item.status,
        );
        const assigneeText = getTaskAssigneeText(item);
        const dueTimeText = formatDueDate(item.dueTime);
        const deleting = props.deletingTaskId === item.id;
        const detailDisabled = !props.onOpenDetail;

        return (
          <TaskDetailSubtaskRow key={item.id}>
            <TaskDetailSubtaskTitleCell>
              {isEditingCell(item.id, 'title') ? (
                <InlineTitleEditor
                  disabled={isSavingCell(item.id, 'title')}
                  value={item.title}
                  onCancel={props.onCloseEditingCell}
                  onSave={async (value) => {
                    await props.onTitleSave(item, value);
                  }}
                />
              ) : (
                <CellDisplay
                  disabled={Boolean(props.savingCellKey) || props.disabled}
                  onClick={() => {
                    props.onStartEditCell(item.id, 'title');
                  }}
                >
                  <Typography.Text strong title={item.title}>
                    {item.title}
                  </Typography.Text>
                </CellDisplay>
              )}
            </TaskDetailSubtaskTitleCell>

            <TaskDetailSubtaskCell>
              {isEditingCell(item.id, 'status') ? (
                <InlineDropdownEditor
                  disabled={isSavingCell(item.id, 'status')}
                  options={statusOptions}
                  value={item.status}
                  onCancel={props.onCloseEditingCell}
                  onSave={async (value) => {
                    await props.onStatusSave(item, value);
                  }}
                >
                  <CellDisplay disabled onClick={() => undefined}>
                    <Typography.Text>
                      {getBoardStatusText(item.status, props.statusConfigs)}
                    </Typography.Text>
                  </CellDisplay>
                </InlineDropdownEditor>
              ) : (
                <CellDisplay
                  disabled={Boolean(props.savingCellKey) || props.disabled}
                  onClick={() => {
                    props.onStartEditCell(item.id, 'status');
                  }}
                >
                  <Typography.Text>
                    {getBoardStatusText(item.status, props.statusConfigs)}
                  </Typography.Text>
                </CellDisplay>
              )}
            </TaskDetailSubtaskCell>

            <TaskDetailSubtaskCell>
              {isEditingCell(item.id, 'assigneeId') ? (
                <ProjectTaskAssigneeEditor
                  currentLabel={assigneeText}
                  disabled={isSavingCell(item.id, 'assigneeId')}
                  value={item.assigneeId}
                  width={180}
                  onCancel={props.onCloseEditingCell}
                  onSave={async (value) => {
                    await props.onAssigneeSave(item, value);
                  }}
                />
              ) : (
                <CellDisplay
                  disabled={Boolean(props.savingCellKey) || props.disabled}
                  onClick={() => {
                    props.onStartEditCell(item.id, 'assigneeId');
                  }}
                >
                  <Typography.Text>{assigneeText}</Typography.Text>
                </CellDisplay>
              )}
            </TaskDetailSubtaskCell>

            <TaskDetailSubtaskCell>
              {isEditingCell(item.id, 'dueTime') ? (
                <InlineDateEditor
                  disabled={isSavingCell(item.id, 'dueTime')}
                  placeholder={dueTimeText}
                  value={item.dueTime}
                  width={190}
                  onCancel={props.onCloseEditingCell}
                  onSave={async (value) => {
                    await props.onDueTimeSave(item, value);
                  }}
                />
              ) : (
                <CellDisplay
                  disabled={Boolean(props.savingCellKey) || props.disabled}
                  onClick={() => {
                    props.onStartEditCell(item.id, 'dueTime');
                  }}
                >
                  <Typography.Text>{dueTimeText}</Typography.Text>
                </CellDisplay>
              )}
            </TaskDetailSubtaskCell>

            <TaskDetailSubtaskCell>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  type={'link'}
                  size={'small'}
                  disabled={detailDisabled}
                  style={{ padding: 0 }}
                  onClick={async () => {
                    await props.onOpenDetail?.(item);
                  }}
                >
                  详情
                </Button>
                <Button
                  danger
                  type={'link'}
                  size={'small'}
                  style={{ padding: 0 }}
                  loading={deleting}
                  onClick={async () => {
                    await props.onDelete?.(item);
                  }}
                >
                  删除
                </Button>
              </div>
            </TaskDetailSubtaskCell>
          </TaskDetailSubtaskRow>
        );
      })}
    </TaskDetailSubtaskTable>
  );
};

/**
 * 格式化截止时间展示。
 *
 * @param dueTime 截止时间
 * @return 文本
 */
function formatDueDate(dueTime?: string) {
  if (!dueTime) {
    return '-';
  }

  if (dueTime.length >= 10) {
    return dueTime.slice(5, 10);
  }

  return dueTime;
}

export default TaskDetailSubtaskTableSection;
