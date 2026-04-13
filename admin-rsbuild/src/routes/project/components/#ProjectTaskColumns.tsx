import { Button, Popconfirm, Space, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';

import {
  ProjectTaskSortField,
  TaskPriorityLabel,
  TaskPriorityOptions,
  TaskStatusLabel,
  TaskStatusOptions,
} from '@/api/modules/project-task.types';

import {
  getDateDisplayText,
  getDateTextType,
  getSortOrder,
  getWorkDaysDisplayText,
  priorityColorMap,
  statusColorMap,
} from './#projectTaskHelper';
import ProjectTaskAssigneeEditor from './#ProjectTaskAssigneeEditor';
import {
  CellDisplay,
  InlineDateEditor,
  InlineDropdownEditor,
} from './#ProjectTaskInlineEditors';
import type {
  CellOption,
  EditableField,
  EditingCell,
  ProjectTaskItem,
  TaskSorterState,
} from './#projectTaskTypes';

export interface ProjectTaskColumnProps {
  canDelete: boolean;
  canEdit: boolean;
  editingCell: EditingCell | null;
  memberOptions: CellOption[];
  savingCellKey?: string;
  sorter: TaskSorterState;
  onAssigneeSave: (
    task: ProjectTaskItem,
    value?: string | number,
  ) => Promise<void>;
  onCloseEditingCell: () => void;
  onDelete: (taskId: number) => Promise<void>;
  onDueTimeSave: (task: ProjectTaskItem, value?: string) => Promise<void>;
  onEdit: (task: ProjectTaskItem) => Promise<void>;
  onPrioritySave: (
    task: ProjectTaskItem,
    value?: string | number,
  ) => Promise<void>;
  onStartEditCell: (taskId: number, field: EditableField) => void;
  onStartTimeSave: (task: ProjectTaskItem, value?: string) => Promise<void>;
  onStatusSave: (
    task: ProjectTaskItem,
    value?: string | number,
  ) => Promise<void>;
}

/**
 * 构建任务表格列定义。
 */
export function createProjectTaskColumns(
  props: ProjectTaskColumnProps,
): TableColumnsType<ProjectTaskItem> {
  const getCellKey = (taskId: number, field: EditableField) => {
    return `${taskId}:${field}`;
  };

  const isEditingCell = (taskId: number, field: EditableField) => {
    if (!props.editingCell) {
      return false;
    }

    return (
      props.editingCell.taskId === taskId && props.editingCell.field === field
    );
  };

  const isSavingCell = (taskId: number, field: EditableField) => {
    return props.savingCellKey === getCellKey(taskId, field);
  };

  return [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 72,
    },
    {
      title: '任务',
      dataIndex: 'title',
      key: 'title',
      ellipsis: {
        showTitle: false,
      },
      render: (value: ProjectTaskItem['title']) => {
        return (
          <Typography.Text ellipsis={{ tooltip: value }} strong>
            {value}
          </Typography.Text>
        );
      },
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 128,
      render: (_: ProjectTaskItem['assignee'], task: ProjectTaskItem) => {
        const assigneeName = task.assignee || '未分配';

        if (isEditingCell(task.id, 'assigneeId')) {
          return (
            <ProjectTaskAssigneeEditor
              currentLabel={assigneeName}
              disabled={isSavingCell(task.id, 'assigneeId')}
              value={task.assigneeId}
              width={168}
              onCancel={props.onCloseEditingCell}
              onSave={async (value) => {
                await props.onAssigneeSave(task, value);
              }}
            />
          );
        }

        return (
          <CellDisplay
            disabled={Boolean(props.savingCellKey) || !props.canEdit}
            onClick={() => {
              if (!props.canEdit) {
                return;
              }
              props.onStartEditCell(task.id, 'assigneeId');
            }}
          >
            <Typography.Text ellipsis={{ tooltip: assigneeName }}>
              {assigneeName}
            </Typography.Text>
          </CellDisplay>
        );
      },
    },
    {
      title: '预计工时（人天）',
      dataIndex: 'workDays',
      key: 'workDays',
      width: 132,
      render: (value: ProjectTaskItem['workDays']) => {
        return getWorkDaysDisplayText(value);
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 96,
      sorter: true,
      sortOrder: getSortOrder(ProjectTaskSortField.Priority, props.sorter),
      render: (value: ProjectTaskItem['priority'], task: ProjectTaskItem) => {
        const priorityLabel = TaskPriorityLabel[value];

        if (isEditingCell(task.id, 'priority')) {
          return (
            <InlineDropdownEditor
              disabled={isSavingCell(task.id, 'priority')}
              options={TaskPriorityOptions}
              value={value}
              onCancel={props.onCloseEditingCell}
              onSave={async (nextValue) => {
                await props.onPrioritySave(task, nextValue);
              }}
            >
              <CellDisplay
                disabled
                onClick={() => {
                  return;
                }}
              >
                <Tag
                  color={priorityColorMap[value]}
                  style={{ marginInlineEnd: 0 }}
                >
                  {priorityLabel}
                </Tag>
              </CellDisplay>
            </InlineDropdownEditor>
          );
        }

        return (
          <CellDisplay
            disabled={Boolean(props.savingCellKey) || !props.canEdit}
            onClick={() => {
              if (!props.canEdit) {
                return;
              }
              props.onStartEditCell(task.id, 'priority');
            }}
          >
            <Tag color={priorityColorMap[value]} style={{ marginInlineEnd: 0 }}>
              {priorityLabel}
            </Tag>
          </CellDisplay>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 108,
      render: (value: ProjectTaskItem['status'], task: ProjectTaskItem) => {
        const statusLabel = TaskStatusLabel[value];

        if (isEditingCell(task.id, 'status')) {
          return (
            <InlineDropdownEditor
              disabled={isSavingCell(task.id, 'status')}
              options={TaskStatusOptions}
              value={value}
              onCancel={props.onCloseEditingCell}
              onSave={async (nextValue) => {
                await props.onStatusSave(task, nextValue);
              }}
            >
              <CellDisplay
                disabled
                onClick={() => {
                  return;
                }}
              >
                <Tag color={statusColorMap[value]} style={{ marginInlineEnd: 0 }}>
                  {statusLabel}
                </Tag>
              </CellDisplay>
            </InlineDropdownEditor>
          );
        }

        return (
          <CellDisplay
            disabled={Boolean(props.savingCellKey) || !props.canEdit}
            onClick={() => {
              if (!props.canEdit) {
                return;
              }
              props.onStartEditCell(task.id, 'status');
            }}
          >
            <Tag color={statusColorMap[value]} style={{ marginInlineEnd: 0 }}>
              {statusLabel}
            </Tag>
          </CellDisplay>
        );
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 168,
      sorter: true,
      sortOrder: getSortOrder(ProjectTaskSortField.StartTime, props.sorter),
      render: (value: ProjectTaskItem['startTime'], task: ProjectTaskItem) => {
        const text = getDateDisplayText(value);
        const textType = getDateTextType(value);

        if (isEditingCell(task.id, 'startTime')) {
          return (
            <InlineDateEditor
              disabled={isSavingCell(task.id, 'startTime')}
              placeholder={text}
              value={value}
              width={196}
              onCancel={props.onCloseEditingCell}
              onSave={async (nextValue) => {
                await props.onStartTimeSave(task, nextValue);
              }}
            />
          );
        }

        return (
          <CellDisplay
            disabled={Boolean(props.savingCellKey) || !props.canEdit}
            onClick={() => {
              if (!props.canEdit) {
                return;
              }
              props.onStartEditCell(task.id, 'startTime');
            }}
          >
            <Typography.Text type={textType} ellipsis={{ tooltip: text }}>
              {text}
            </Typography.Text>
          </CellDisplay>
        );
      },
    },
    {
      title: '截止时间',
      dataIndex: 'dueTime',
      key: 'dueTime',
      width: 168,
      render: (value: ProjectTaskItem['dueTime'], task: ProjectTaskItem) => {
        const text = getDateDisplayText(value);
        const textType = getDateTextType(value);

        if (isEditingCell(task.id, 'dueTime')) {
          return (
            <InlineDateEditor
              disabled={isSavingCell(task.id, 'dueTime')}
              placeholder={text}
              value={value}
              width={196}
              onCancel={props.onCloseEditingCell}
              onSave={async (nextValue) => {
                await props.onDueTimeSave(task, nextValue);
              }}
            />
          );
        }

        return (
          <CellDisplay
            disabled={Boolean(props.savingCellKey) || !props.canEdit}
            onClick={() => {
              if (!props.canEdit) {
                return;
              }
              props.onStartEditCell(task.id, 'dueTime');
            }}
          >
            <Typography.Text type={textType} ellipsis={{ tooltip: text }}>
              {text}
            </Typography.Text>
          </CellDisplay>
        );
      },
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 110,
      render: (value: ProjectTaskItem['creator']) => {
        if (!value) {
          return '-';
        }

        return value;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 156,
      render: (value: ProjectTaskItem['updatedAt']) => {
        if (!value) {
          return '-';
        }

        return value;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 132,
      fixed: 'right',
      render: (_: unknown, task: ProjectTaskItem) => {
        return (
          <Space size={4}>
            {props.canEdit ? (
              <Button
                size="small"
                type="text"
                onClick={async () => {
                  await props.onEdit(task);
                }}
              >
                编辑
              </Button>
            ) : null}

            {props.canDelete ? (
              <Popconfirm
                title="确认删除任务"
                description="删除后无法恢复，确认继续吗？"
                okText="确认"
                cancelText="取消"
                onConfirm={async () => {
                  await props.onDelete(task.id);
                }}
              >
                <Button danger size="small" type="text">
                  删除
                </Button>
              </Popconfirm>
            ) : null}
          </Space>
        );
      },
    },
  ];
}
