import { createFileRoute } from '@tanstack/react-router';
import {
  type KeyboardEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import {
  Button,
  DatePicker,
  Dropdown,
  Empty,
  Flex,
  Input,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import type { TableColumnsType, TableProps } from 'antd';

import { ApiProjectMember, ApiProjectTask } from '@/api';
import {
  ProjectTaskSortField,
  ProjectTaskSortOrder,
  TaskPriority,
  TaskPriorityLabel,
  TaskPriorityOptions,
  TaskStatus,
  TaskStatusLabel,
  TaskStatusOptions,
  type EditProjectTaskParams,
  type ProjectTaskDetail,
} from '@/api/modules/project-task.types';
import { KTable } from '@/components';
import { useKModal } from '@/components/KModal';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';
import { Route as ProjectDetailRoute } from './$projectId';
import TaskCreateForm from './components/#TaskCreateForm';

export const Route = createFileRoute('/project/$projectId/tasks')({
  component: RouteComponent,
});

type ProjectTaskItem = Awaited<
  ReturnType<typeof ApiProjectTask.getList>
>['items'][number];

type EditableField =
  | 'assigneeId'
  | 'priority'
  | 'status'
  | 'startTime'
  | 'dueTime';

interface EditingCell {
  taskId: number;
  field: EditableField;
}

interface TaskSorterState {
  field?: ProjectTaskSortField;
  order?: ProjectTaskSortOrder;
}

interface CellOption {
  label: string;
  value: string | number;
}

interface CellDisplayProps {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}

interface InlineSelectEditorProps {
  disabled?: boolean;
  options: CellOption[];
  placeholder: string;
  value?: string | number;
  width: number;
  onCancel: () => void;
  onSave: (value?: string | number) => Promise<void>;
}

interface InlineDateEditorProps {
  disabled?: boolean;
  placeholder: string;
  value?: string;
  width: number;
  onCancel: () => void;
  onSave: (value?: string) => Promise<void>;
}

interface InlineDropdownEditorProps {
  children: ReactNode;
  disabled?: boolean;
  onCancel: () => void;
  onSave: (value?: string | number) => Promise<void>;
  options: CellOption[];
  value?: string | number;
}

const priorityColorMap: Record<TaskPriority, string> = {
  [TaskPriority.High]: 'red',
  [TaskPriority.Medium]: 'gold',
  [TaskPriority.Low]: 'blue',
};

const statusColorMap: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'orange',
  [TaskStatus.InProgress]: 'blue',
  [TaskStatus.Done]: 'green',
  [TaskStatus.Canceled]: 'default',
};

const compactCellStyle = {
  minHeight: 26,
  minWidth: 80,
  paddingInline: 6,
  borderRadius: 6,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  width: '100%',
  overflow: 'hidden',
} as const;

const UNASSIGNED_ASSIGNEE_VALUE = -1;
const ALL_ASSIGNEE_FILTER_VALUE = -2;
const ALL_PRIORITY_FILTER_VALUE = 'allPriority';
const ALL_STATUS_FILTER_VALUE = 'allStatus';

/**
 * 任务列表页。
 *
 * 交互规则：
 * - 单击单元格立即进入编辑态
 * - 同一时间只允许一个单元格编辑
 * - 选择或关闭日期面板后自动提交
 */
function RouteComponent() {
  const { projectId } = Route.useParams();
  const modal = useKModal();
  const queryClient = useQueryClient();
  const project = ProjectDetailRoute.useLoaderData();

  const numericProjectId = Number(projectId);
  const isValidProjectId =
    Number.isInteger(numericProjectId) && numericProjectId > 0;

  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority | undefined>();
  const [status, setStatus] = useState<TaskStatus | undefined>();
  const [assigneeId, setAssigneeId] = useState<number | undefined>();
  const [sorter, setSorter] = useState<TaskSorterState>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [savingCellKey, setSavingCellKey] = useState<string>();
  const saveLockRef = useRef(false);

  const { data: memberList } = useQuery({
    queryKey: ['projectMemberList', numericProjectId],
    queryFn: () => ApiProjectMember.getList(numericProjectId),
    enabled: isValidProjectId,
  });

  const memberOptions = useMemo(() => {
    return (memberList ?? []).map((item) => {
      const label = item.nickname || `用户 #${item.userId}`;

      return {
        label,
        value: item.userId,
      };
    });
  }, [memberList]);

  const assigneeFilterOptions = useMemo(() => {
    return [
      {
        label: '全部负责人',
        value: ALL_ASSIGNEE_FILTER_VALUE,
      },
      ...memberOptions,
    ];
  }, [memberOptions]);

  const priorityFilterOptions = useMemo(() => {
    return [
      {
        label: '全部优先级',
        value: ALL_PRIORITY_FILTER_VALUE,
      },
      ...TaskPriorityOptions,
    ];
  }, []);

  const statusFilterOptions = useMemo(() => {
    return [
      {
        label: '全部状态',
        value: ALL_STATUS_FILTER_VALUE,
      },
      ...TaskStatusOptions,
    ];
  }, []);

  const params = useMemo(() => {
    return {
      ...pagination,
      projectId: numericProjectId,
      title: normalizeKeyword(title),
      priority,
      status,
      assigneeId,
      sortField: sorter.field,
      sortOrder: sorter.order,
    };
  }, [
    assigneeId,
    numericProjectId,
    pagination,
    priority,
    sorter.field,
    sorter.order,
    status,
    title,
  ]);

  const hasFilters = Boolean(
    title || priority || status || assigneeId || sorter.field,
  );

  const closeEditingCell = () => {
    setEditingCell(null);
  };

  const resetToFirstPage = () => {
    setPagination((previous) => ({
      ...previous,
      current: 1,
    }));
  };

  const startEditCell = (taskId: number, field: EditableField) => {
    if (saveLockRef.current) {
      return;
    }

    if (savingCellKey) {
      return;
    }

    setEditingCell({ taskId, field });
  };

  const invalidateTaskQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskList(numericProjectId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.todo.list(),
      }),
    ]);
  };

  const openTaskForm = async (task?: ProjectTaskDetail) => {
    let modalTitle = '新建任务';

    if (task) {
      modalTitle = '编辑任务';
    }

    try {
      await modal.open({
        title: modalTitle,
        width: 960,
        styles: {
          body: {
            height: 580,
            overflowX: 'hidden',
            overflowY: 'auto',
          },
        },
        children: <TaskCreateForm projectId={numericProjectId} task={task} />,
      });

      await invalidateTaskQueries();
    } catch (error) {
      if (error === 'KModal cancel') {
        return;
      }

      throw error;
    }
  };

  const handleDelete = async (taskId: number) => {
    await ApiProjectTask.deleted([taskId]);
    message.success('删除成功');
    await invalidateTaskQueries();
  };

  const getCellKey = (taskId: number, field: EditableField) => {
    return `${taskId}:${field}`;
  };

  const isEditingCell = (taskId: number, field: EditableField) => {
    if (!editingCell) {
      return false;
    }

    return editingCell.taskId === taskId && editingCell.field === field;
  };

  const isSavingCell = (taskId: number, field: EditableField) => {
    return savingCellKey === getCellKey(taskId, field);
  };

  const buildEditPayload = (
    task: ProjectTaskDetail,
    patch: Partial<EditProjectTaskParams>,
  ): EditProjectTaskParams => {
    let nextAssigneeId = task.assigneeId;
    let nextStartTime = normalizeDateValue(task.startTime);
    let nextDueTime = normalizeDateValue(task.dueTime);

    if (Object.prototype.hasOwnProperty.call(patch, 'assigneeId')) {
      nextAssigneeId = patch.assigneeId;
    }

    if (Object.prototype.hasOwnProperty.call(patch, 'startTime')) {
      nextStartTime = patch.startTime;
    }

    if (Object.prototype.hasOwnProperty.call(patch, 'dueTime')) {
      nextDueTime = patch.dueTime;
    }

    return {
      title: patch.title ?? task.title,
      description: patch.description ?? task.description,
      status: patch.status ?? task.status,
      priority: patch.priority ?? task.priority,
      assigneeId: nextAssigneeId,
      startTime: nextStartTime,
      dueTime: nextDueTime,
    };
  };

  const updateTaskField = async (
    task: ProjectTaskDetail,
    field: EditableField,
    patch: Partial<EditProjectTaskParams>,
  ) => {
    const cellKey = getCellKey(task.id, field);
    saveLockRef.current = true;
    setSavingCellKey(cellKey);

    try {
      await ApiProjectTask.edit(task.id, buildEditPayload(task, patch));
      closeEditingCell();
      await invalidateTaskQueries();
    } catch {
      closeEditingCell();
    } finally {
      saveLockRef.current = false;
      setSavingCellKey(undefined);
    }
  };

  const handleAssigneeSave = async (
    task: ProjectTaskItem,
    value?: string | number,
  ) => {
    const nextAssigneeId = normalizeAssigneeValue(value);

    if (nextAssigneeId === task.assigneeId) {
      closeEditingCell();
      return;
    }

    await updateTaskField(task, 'assigneeId', {
      assigneeId: nextAssigneeId,
    });
  };

  const handlePrioritySave = async (
    task: ProjectTaskItem,
    value?: string | number,
  ) => {
    const nextPriority = normalizeTaskPriority(value);

    if (!nextPriority) {
      closeEditingCell();
      return;
    }

    if (nextPriority === task.priority) {
      closeEditingCell();
      return;
    }

    await updateTaskField(task, 'priority', {
      priority: nextPriority,
    });
  };

  const handleStatusSave = async (
    task: ProjectTaskItem,
    value?: string | number,
  ) => {
    const nextStatus = normalizeTaskStatus(value);

    if (!nextStatus) {
      closeEditingCell();
      return;
    }

    if (nextStatus === task.status) {
      closeEditingCell();
      return;
    }

    await updateTaskField(task, 'status', {
      status: nextStatus,
    });
  };

  const handleStartTimeSave = async (task: ProjectTaskItem, value?: string) => {
    const normalizedValue = normalizeDateValue(value);
    const currentValue = normalizeDateValue(task.startTime);

    if (normalizedValue === currentValue) {
      closeEditingCell();
      return;
    }

    await updateTaskField(task, 'startTime', {
      startTime: normalizedValue,
    });
  };

  const handleDueTimeSave = async (task: ProjectTaskItem, value?: string) => {
    const normalizedValue = normalizeDateValue(value);
    const currentValue = normalizeDateValue(task.dueTime);

    if (normalizedValue === currentValue) {
      closeEditingCell();
      return;
    }

    await updateTaskField(task, 'dueTime', {
      dueTime: normalizedValue,
    });
  };

  const getSortOrder = (
    field: ProjectTaskSortField,
  ): 'ascend' | 'descend' | null => {
    if (sorter.field !== field) {
      return null;
    }

    if (!sorter.order) {
      return null;
    }

    if (sorter.order === ProjectTaskSortOrder.Asc) {
      return 'ascend';
    }

    return 'descend';
  };

  const handleTableChange: TableProps<ProjectTaskItem>['onChange'] = (
    _pagination,
    _filters,
    sorterValue,
    extra,
  ) => {
    let normalizedSorter = sorterValue;

    if (extra.action !== 'sort') {
      return;
    }

    closeEditingCell();
    resetToFirstPage();

    if (Array.isArray(sorterValue)) {
      normalizedSorter = sorterValue[0];
    }

    const nextOrder = normalizedSorter?.order;
    const nextField = normalizedSorter?.field;

    if (!nextOrder || !nextField) {
      setSorter({});
      return;
    }

    if (
      nextField !== ProjectTaskSortField.Priority &&
      nextField !== ProjectTaskSortField.StartTime
    ) {
      setSorter({});
      return;
    }

    if (nextOrder === 'ascend') {
      setSorter({
        field: nextField,
        order: ProjectTaskSortOrder.Asc,
      });
      return;
    }

    setSorter({
      field: nextField,
      order: ProjectTaskSortOrder.Desc,
    });
  };

  const columns: TableColumnsType<ProjectTaskItem> = [
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
        const assigneeEditorOptions = getAssigneeEditorOptions(
          memberOptions,
          task.assigneeId,
        );

        if (isEditingCell(task.id, 'assigneeId')) {
          return (
            <InlineSelectEditor
              disabled={isSavingCell(task.id, 'assigneeId')}
              options={assigneeEditorOptions}
              placeholder={assigneeName}
              value={task.assigneeId}
              width={168}
              onCancel={closeEditingCell}
              onSave={async (value) => {
                await handleAssigneeSave(task, value);
              }}
            />
          );
        }

        return (
          <CellDisplay
            disabled={Boolean(savingCellKey)}
            onClick={() => {
              startEditCell(task.id, 'assigneeId');
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
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 96,
      sorter: true,
      sortOrder: getSortOrder(ProjectTaskSortField.Priority),
      render: (value: ProjectTaskItem['priority'], task: ProjectTaskItem) => {
        const priorityLabel = TaskPriorityLabel[value];

        if (isEditingCell(task.id, 'priority')) {
          return (
            <InlineDropdownEditor
              disabled={isSavingCell(task.id, 'priority')}
              options={TaskPriorityOptions}
              value={value}
              onCancel={closeEditingCell}
              onSave={async (nextValue) => {
                await handlePrioritySave(task, nextValue);
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
            disabled={Boolean(savingCellKey)}
            onClick={() => {
              startEditCell(task.id, 'priority');
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
              onCancel={closeEditingCell}
              onSave={async (nextValue) => {
                await handleStatusSave(task, nextValue);
              }}
            >
              <CellDisplay
                disabled
                onClick={() => {
                  return;
                }}
              >
                <Tag
                  color={statusColorMap[value]}
                  style={{ marginInlineEnd: 0 }}
                >
                  {statusLabel}
                </Tag>
              </CellDisplay>
            </InlineDropdownEditor>
          );
        }

        return (
          <CellDisplay
            disabled={Boolean(savingCellKey)}
            onClick={() => {
              startEditCell(task.id, 'status');
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
      sortOrder: getSortOrder(ProjectTaskSortField.StartTime),
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
              onCancel={closeEditingCell}
              onSave={async (nextValue) => {
                await handleStartTimeSave(task, nextValue);
              }}
            />
          );
        }

        return (
          <CellDisplay
            disabled={Boolean(savingCellKey)}
            onClick={() => {
              startEditCell(task.id, 'startTime');
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
              onCancel={closeEditingCell}
              onSave={async (nextValue) => {
                await handleDueTimeSave(task, nextValue);
              }}
            />
          );
        }

        return (
          <CellDisplay
            disabled={Boolean(savingCellKey)}
            onClick={() => {
              startEditCell(task.id, 'dueTime');
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
        const text = value || '-';
        return text;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 156,
      render: (value: ProjectTaskItem['updatedAt']) => {
        const text = value || '-';
        return text;
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
            <Button
              size="small"
              type="text"
              onClick={async () => {
                await openTaskForm(task);
              }}
            >
              编辑
            </Button>

            <Popconfirm
              title="确认删除任务"
              description="删除后无法恢复，确认继续吗？"
              okText="确认"
              cancelText="取消"
              onConfirm={async () => {
                await handleDelete(task.id);
              }}
            >
              <Button danger size="small" type="text">
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <KTable<ProjectTaskItem>
      size="small"
      queryKey={[...queryKey.project.taskList(numericProjectId), params]}
      request={(requestParams) => ApiProjectTask.getList(requestParams)}
      params={params}
      columns={columns}
      onChange={handleTableChange}
      scroll={{ x: 1200 }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        showSizeChanger: true,
        showQuickJumper: true,
        size: 'small',
        onChange: (current, pageSize) => {
          closeEditingCell();
          setPagination({ current, pageSize });
        },
      }}
      locale={{
        emptyText: (
          <Empty description={getEmptyDescription(hasFilters, project?.name)} />
        ),
      }}
      toolbar={
        <Flex justify="space-between" gap={8} wrap style={{ width: '100%' }}>
          <Space wrap size={8}>
            <Input.Search
              allowClear={false}
              size="small"
              placeholder="任务标题"
              style={{ width: 200 }}
              onSearch={(value) => {
                closeEditingCell();
                resetToFirstPage();
                setTitle(value);
              }}
            />

            <Select
              allowClear={false}
              size="small"
              placeholder="优先级"
              style={{ width: 110 }}
              options={priorityFilterOptions}
              value={getPriorityFilterValue(priority)}
              onChange={(value) => {
                closeEditingCell();
                resetToFirstPage();
                setPriority(normalizePriorityFilterValue(value));
              }}
            />

            <Select
              allowClear={false}
              size="small"
              placeholder="状态"
              style={{ width: 128 }}
              options={statusFilterOptions}
              value={getStatusFilterValue(status)}
              onChange={(value) => {
                closeEditingCell();
                resetToFirstPage();
                setStatus(normalizeStatusFilterValue(value));
              }}
            />

            <Select
              allowClear={false}
              size="small"
              placeholder="负责人"
              style={{ width: 160 }}
              value={getAssigneeFilterValue(assigneeId)}
              options={assigneeFilterOptions}
              onChange={(value) => {
                closeEditingCell();
                resetToFirstPage();
                setAssigneeId(normalizeAssigneeFilterValue(value));
              }}
            />
          </Space>

          <Button
            type="primary"
            size="small"
            icon={<Icons.Plus />}
            onClick={async () => {
              await openTaskForm();
            }}
          >
            新建任务
          </Button>
        </Flex>
      }
    />
  );
}

/**
 * 展示态单元格。
 *
 * 统一处理键盘可访问性和紧凑尺寸。
 */
function CellDisplay(props: CellDisplayProps) {
  let tabIndex = 0;

  if (props.disabled) {
    tabIndex = -1;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (props.disabled) {
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    props.onClick();
  };

  return (
    <div
      role="button"
      tabIndex={tabIndex}
      style={compactCellStyle}
      onClick={() => {
        if (props.disabled) {
          return;
        }

        props.onClick();
      }}
      onKeyDown={handleKeyDown}
    >
      {props.children}
    </div>
  );
}

/**
 * 单元格内联下拉编辑器。
 *
 * 组件挂载后立即展开，下拉关闭时若未保存则恢复展示态。
 */
function InlineSelectEditor(props: InlineSelectEditorProps) {
  const closingBySaveRef = useRef(false);
  const [open, setOpen] = useState(true);

  const handleChange = async (value?: string | number) => {
    closingBySaveRef.current = true;
    setOpen(false);
    await props.onSave(value);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      return;
    }

    if (closingBySaveRef.current) {
      return;
    }

    props.onCancel();
  };

  return (
    <Select
      allowClear={false}
      autoFocus
      disabled={props.disabled}
      open={open}
      options={props.options}
      placeholder={props.placeholder}
      popupMatchSelectWidth={false}
      size="small"
      style={{
        width: props.width,
        maxWidth: '100%',
        display: 'inline-block',
        verticalAlign: 'top',
      }}
      variant="borderless"
      value={props.value}
      getPopupContainer={resolvePopupContainer}
      suffixIcon={null}
      styles={{
        input: {
          minHeight: 24,
          display: 'flex',
          alignItems: 'center',
          paddingInlineStart: 0,
          paddingInlineEnd: 18,
          background: 'transparent',
          boxShadow: 'none',
          whiteSpace: 'nowrap',
        },
      }}
      onChange={async (value) => {
        await handleChange(value);
      }}
      onOpenChange={handleOpenChange}
    />
  );
}

/**
 * 单元格内联日期编辑器。
 *
 * 只有点击日期面板的确认按钮时才会提交修改。
 */
function InlineDateEditor(props: InlineDateEditorProps) {
  const closingBySaveRef = useRef(false);
  const [open, setOpen] = useState(true);
  const [draftValue, setDraftValue] = useState<Dayjs | null>(
    parseDateValue(props.value),
  );

  const handleSave = async (value?: string) => {
    closingBySaveRef.current = true;
    setOpen(false);
    await props.onSave(value);
  };

  const handleChange = async (value: Dayjs | null) => {
    setDraftValue(value);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      return;
    }

    if (closingBySaveRef.current) {
      return;
    }

    props.onCancel();
  };

  return (
    <DatePicker
      allowClear={false}
      autoFocus
      variant={'borderless'}
      disabled={props.disabled}
      format="YYYY-MM-DD HH:mm"
      needConfirm
      open={open}
      placeholder={props.placeholder}
      showTime
      size="small"
      style={{ width: props.width }}
      value={draftValue}
      getPopupContainer={resolvePopupContainer}
      onChange={async (value) => {
        await handleChange(value);
      }}
      onOk={async (value) => {
        await handleSave(formatDateValue(value ?? draftValue));
      }}
      onOpenChange={async (nextOpen) => {
        await handleOpenChange(nextOpen);
      }}
    />
  );
}

/**
 * 单元格内联下拉菜单编辑器。
 *
 * 适用于优先级、状态这种轻量枚举字段。
 */
function InlineDropdownEditor(props: InlineDropdownEditorProps) {
  const closingBySaveRef = useRef(false);

  const items = props.options.map((item) => {
    return {
      key: String(item.value),
      label: item.label,
    };
  });

  return (
    <Dropdown
      disabled={props.disabled}
      open
      trigger={['click']}
      menu={{
        items,
        selectable: true,
        selectedKeys: [String(props.value)],
        onClick: async ({ key }) => {
          closingBySaveRef.current = true;
          await props.onSave(key);
        },
      }}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          return;
        }

        if (closingBySaveRef.current) {
          return;
        }

        props.onCancel();
      }}
    >
      <span>{props.children}</span>
    </Dropdown>
  );
}

function normalizeKeyword(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  return trimmedValue;
}

function normalizeNumberValue(value?: string | number) {
  if (typeof value !== 'number') {
    return undefined;
  }

  return value;
}

function normalizeAssigneeValue(value?: string | number) {
  if (value === UNASSIGNED_ASSIGNEE_VALUE) {
    return undefined;
  }

  return normalizeNumberValue(value);
}

function normalizeTaskPriority(value?: string | number) {
  if (value === TaskPriority.High) {
    return TaskPriority.High;
  }

  if (value === TaskPriority.Medium) {
    return TaskPriority.Medium;
  }

  if (value === TaskPriority.Low) {
    return TaskPriority.Low;
  }

  return undefined;
}

function normalizeTaskStatus(value?: string | number) {
  if (value === TaskStatus.Todo) {
    return TaskStatus.Todo;
  }

  if (value === TaskStatus.InProgress) {
    return TaskStatus.InProgress;
  }

  if (value === TaskStatus.Done) {
    return TaskStatus.Done;
  }

  if (value === TaskStatus.Canceled) {
    return TaskStatus.Canceled;
  }

  return undefined;
}

function getAssigneeEditorOptions(
  memberOptions: CellOption[],
  assigneeId?: number,
) {
  if (assigneeId === undefined) {
    return memberOptions;
  }

  return [
    {
      label: '未分配',
      value: UNASSIGNED_ASSIGNEE_VALUE,
    },
    ...memberOptions,
  ];
}

function getPriorityFilterValue(value?: TaskPriority) {
  if (!value) {
    return ALL_PRIORITY_FILTER_VALUE;
  }

  return value;
}

function normalizePriorityFilterValue(value?: string | number) {
  if (value === ALL_PRIORITY_FILTER_VALUE) {
    return undefined;
  }

  return normalizeTaskPriority(value);
}

function getStatusFilterValue(value?: TaskStatus) {
  if (!value) {
    return ALL_STATUS_FILTER_VALUE;
  }

  return value;
}

function normalizeStatusFilterValue(value?: string | number) {
  if (value === ALL_STATUS_FILTER_VALUE) {
    return undefined;
  }

  return normalizeTaskStatus(value);
}

function getAssigneeFilterValue(value?: number) {
  if (value === undefined) {
    return ALL_ASSIGNEE_FILTER_VALUE;
  }

  return value;
}

function normalizeAssigneeFilterValue(value?: string | number) {
  if (value === ALL_ASSIGNEE_FILTER_VALUE) {
    return undefined;
  }

  return normalizeNumberValue(value);
}

function parseDateValue(value?: string) {
  const normalizedValue = normalizeDateValue(value);

  if (!normalizedValue) {
    return null;
  }

  return dayjs(normalizedValue);
}

function formatDateValue(value: Dayjs | null) {
  if (!value) {
    return undefined;
  }

  return value.format('YYYY-MM-DD HH:mm:ss');
}

function normalizeDateValue(value?: string) {
  if (!value) {
    return undefined;
  }

  return value;
}

function getDateDisplayText(value?: string) {
  if (!value) {
    return '未设置';
  }

  return value;
}

function getDateTextType(value?: string): 'secondary' | undefined {
  if (!value) {
    return 'secondary';
  }

  return undefined;
}

function getEmptyDescription(hasFilters: boolean, projectName?: string) {
  if (hasFilters) {
    return '未找到匹配的任务';
  }

  if (!projectName) {
    return '当前项目暂无任务';
  }

  return `${projectName}暂无任务`;
}

function resolvePopupContainer(triggerNode: HTMLElement) {
  const parentElement = triggerNode.parentElement;

  if (!parentElement) {
    return document.body;
  }

  return parentElement;
}
