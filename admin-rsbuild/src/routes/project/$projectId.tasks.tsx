import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import type { TableProps } from 'antd';

import { ApiProjectMember, ApiProjectTask } from '@/api';
import { PERMISSION_RESOURCE } from '@/constants/permission.ts';
import {
  TaskPriority,
  TaskStatus,
  type EditProjectTaskParams,
  type ProjectTaskDetail,
} from '@/api/modules/project-task.types';
import { useKModal } from '@/components/KModal';
import queryKey from '@/constants/queryKey';
import usePermission from '@/hooks/usePermission.ts';
import { openTaskModal } from '@/service/taskModalService.tsx';
import { Route as ProjectDetailRoute } from './$projectId';
import ProjectTaskTable from './components/#ProjectTaskTable';
import ProjectTaskToolbar from './components/#ProjectTaskToolbar';
import {
  buildEditPayload,
  getNextTaskSorter,
  normalizeAssigneeValue,
  normalizeDateValue,
  normalizeKeyword,
  normalizeTaskPriority,
  normalizeTaskStatus,
} from './components/#projectTaskHelper';
import type {
  EditableField,
  EditingCell,
  TaskPaginationState,
  TaskSorterState,
} from './components/#projectTaskTypes';

export const Route = createFileRoute('/project/$projectId/tasks')({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  const modal = useKModal();
  const queryClient = useQueryClient();
  const project = ProjectDetailRoute.useLoaderData();
  const { hasButtonPermission } = usePermission();
  const canCreateTask = hasButtonPermission(
    PERMISSION_RESOURCE.projectTaskCreate,
  );
  const canEditTask = hasButtonPermission(PERMISSION_RESOURCE.projectTaskEdit);
  const canDeleteTask = hasButtonPermission(
    PERMISSION_RESOURCE.projectTaskDelete,
  );

  const numericProjectId = Number(projectId);
  const isValidProjectId =
    Number.isInteger(numericProjectId) && numericProjectId > 0;

  const [pagination, setPagination] = useState<TaskPaginationState>({
    current: 1,
    pageSize: 10,
  });
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
    setPagination((previous) => {
      return {
        ...previous,
        current: 1,
      };
    });
  };

  const startEditCell = (taskId: number, field: EditableField) => {
    if (!canEditTask) {
      return;
    }
    if (saveLockRef.current) {
      return;
    }

    if (savingCellKey) {
      return;
    }

    setEditingCell({ taskId, field });
  };

  const handlePaginationChange = (current: number, pageSize: number) => {
    closeEditingCell();
    setPagination({ current, pageSize });
  };

  const invalidateTaskQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskList(),
      }),
      queryClient.invalidateQueries({
        queryKey: ['projectMemberList', numericProjectId],
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskBoard(),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.todo.list(),
      }),
    ]);
  };

  const openTaskForm = async (task?: ProjectTaskDetail) => {
    const submitted = await openTaskModal(modal, {
      projectId: numericProjectId,
      task,
    });

    if (!submitted) {
      return;
    }

    await invalidateTaskQueries();
  };

  const handleDelete = async (taskId: number) => {
    await ApiProjectTask.deleted([taskId]);
    message.success('删除成功');
    await invalidateTaskQueries();
  };

  const getCellKey = (taskId: number, field: EditableField) => {
    return `${taskId}:${field}`;
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
    task: ProjectTaskDetail,
    value?: string | number,
  ) => {
    const nextAssigneeId = normalizeAssigneeValue(value);
    let nextAssigneePayload = nextAssigneeId;

    if (nextAssigneeId === task.assigneeId) {
      closeEditingCell();
      return;
    }

    if (value === undefined) {
      nextAssigneePayload = 0;
    }

    await updateTaskField(task, 'assigneeId', {
      assigneeId: nextAssigneePayload,
    });
  };

  const handlePrioritySave = async (
    task: ProjectTaskDetail,
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
    task: ProjectTaskDetail,
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

  const handleStartTimeSave = async (
    task: ProjectTaskDetail,
    value?: string,
  ) => {
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

  const handleDueTimeSave = async (
    task: ProjectTaskDetail,
    value?: string,
  ) => {
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

  const handleTableChange: TableProps<ProjectTaskDetail>['onChange'] = (
    _pagination,
    _filters,
    sorterValue,
    extra,
  ) => {
    const nextSorter = getNextTaskSorter(sorterValue, extra.action);

    if (nextSorter === undefined) {
      return;
    }

    closeEditingCell();
    resetToFirstPage();
    setSorter(nextSorter);
  };

  return (
    <ProjectTaskTable
      canDelete={canDeleteTask}
      canEdit={canEditTask}
      editingCell={editingCell}
      hasFilters={hasFilters}
      memberOptions={memberOptions}
      numericProjectId={numericProjectId}
      params={params}
      pagination={pagination}
      projectName={project?.name}
      savingCellKey={savingCellKey}
      sorter={sorter}
      onAssigneeSave={handleAssigneeSave}
      onCloseEditingCell={closeEditingCell}
      onDelete={handleDelete}
      onDueTimeSave={handleDueTimeSave}
      onEdit={openTaskForm}
      onPaginationChange={handlePaginationChange}
      onPrioritySave={handlePrioritySave}
      onStartEditCell={startEditCell}
      onStartTimeSave={handleStartTimeSave}
      onStatusSave={handleStatusSave}
      onTableChange={handleTableChange}
      toolbar={
        <ProjectTaskToolbar
          assigneeId={assigneeId}
          canCreateTask={canCreateTask}
          memberOptions={memberOptions}
          priority={priority}
          status={status}
          onAssigneeChange={(value) => {
            closeEditingCell();
            resetToFirstPage();
            setAssigneeId(value);
          }}
          onCreate={async () => {
            await openTaskForm();
          }}
          onPriorityChange={(value) => {
            closeEditingCell();
            resetToFirstPage();
            setPriority(value);
          }}
          onStatusChange={(value) => {
            closeEditingCell();
            resetToFirstPage();
            setStatus(value);
          }}
          onTitleSearch={(value) => {
            closeEditingCell();
            resetToFirstPage();
            setTitle(value);
          }}
        />
      }
    />
  );
}
