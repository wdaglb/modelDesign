import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Card, message } from 'antd';

import { ApiProject, ApiProjectTask, ApiProjectTaskStatus } from '@/api';
import { TaskPriority, type ProjectTaskDetail } from '@/api/modules/project-task.types';
import { useKDrawer } from '@/components/KDrawer';
import { useKModal } from '@/components/KModal';
import queryKey from '@/constants/queryKey';
import { openTaskModal } from '@/service/taskModalService.tsx';
import { AgileBoardCardPreview } from './agile-board/#BoardCard';
import AgileBoardColumn from './agile-board/#BoardColumn';
import { openTaskPreviewDrawer } from './agile-board/#previewDrawerService';
import AgileBoardToolbar from './agile-board/#BoardToolbar';
import {
  buildAgileBoardColumns,
  buildBoardEditPayload,
  buildBoardQueryParams,
  getTaskDragId,
  groupBoardTasks,
  resolveDropStatus,
} from './agile-board/#helper';
import type { AgileBoardFilterState, AgileBoardTask } from './agile-board/#types';

export const Route = createFileRoute('/agile-board')({
  component: RouteComponent,
});

/**
 * 敏捷面板页面。
 */
function RouteComponent() {
  const drawer = useKDrawer();
  const modal = useKModal();
  const queryClient = useQueryClient();
  const [activeTaskDragId, setActiveTaskDragId] = useState<string>();
  const [filters, setFilters] = useState<AgileBoardFilterState>({
    title: '',
  });
  const [previewTaskId, setPreviewTaskId] = useState<number>();
  const [updatingTaskId, setUpdatingTaskId] = useState<number>();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const params = useMemo(() => buildBoardQueryParams(filters), [filters]);

  const { data: projectListData } = useQuery({
    queryKey: [...queryKey.project.list(), 'agile-board'],
    queryFn: () => ApiProject.getList({ current: 1, pageSize: 999 }),
  });

  const { data: boardTasks = [] } = useQuery({
    queryKey: [...queryKey.project.taskBoard(), params],
    queryFn: () => ApiProjectTask.getAgileBoard(params),
  });
  const { data: statusConfigs = [] } = useQuery({
    queryKey: queryKey.project.taskStatusList(),
    queryFn: () => ApiProjectTaskStatus.getList(),
  });

  const projectOptions = useMemo(() => {
    return (projectListData?.items ?? []).map((item) => ({
      label: item.name,
      value: item.id,
    }));
  }, [projectListData]);
  const agileBoardColumns = useMemo(
    () => buildAgileBoardColumns(statusConfigs, boardTasks),
    [statusConfigs, boardTasks],
  );
  const groupedTasks = useMemo(
    () => groupBoardTasks(boardTasks, agileBoardColumns),
    [boardTasks, agileBoardColumns],
  );
  const hasFilters = useMemo(() => {
    return Boolean(
      filters.title ||
        filters.projectId !== undefined ||
        filters.assigneeId !== undefined ||
        filters.priority !== undefined,
    );
  }, [filters]);

  const taskMap = useMemo(() => {
    const nextTaskMap = new Map<string, AgileBoardTask>();
    boardTasks.forEach((task) => {
      nextTaskMap.set(getTaskDragId(task.id), task);
    });
    return nextTaskMap;
  }, [boardTasks]);
  const activeTask = useMemo(() => {
    if (!activeTaskDragId) {
      return undefined;
    }
    return taskMap.get(activeTaskDragId);
  }, [activeTaskDragId, taskMap]);

  const invalidateBoardQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskBoard(),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskList(),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.todo.list(),
      }),
    ]);
  };

  const openTaskForm = async (task?: ProjectTaskDetail) => {
    const submitted = await openTaskModal(modal, {
      statusConfigs,
      task,
    });
    if (!submitted) {
      return;
    }
    await invalidateBoardQueries();
  };

  const openTaskPreview = async (task: AgileBoardTask) => {
    if (previewTaskId !== undefined) {
      return;
    }

    setPreviewTaskId(task.id);

    try {
      await openTaskPreviewDrawer(drawer, {
        taskId: task.id,
        statusConfigs,
        onTaskUpdated: invalidateBoardQueries,
        onEdit: async (detailTask) => {
          await openTaskForm(detailTask);
        },
      });
    } catch (error) {
      if (error !== 'KDrawer cancel') {
        throw error;
      }
    } finally {
      setPreviewTaskId(undefined);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (updatingTaskId !== undefined) {
      return;
    }

    setActiveTaskDragId(String(event.active.id));
  };

  const handleDragCancel = () => {
    setActiveTaskDragId(undefined);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    try {
      if (updatingTaskId !== undefined) {
        return;
      }

      if (!event.over) {
        return;
      }

      const task = taskMap.get(String(event.active.id));

      if (!task) {
        return;
      }

      const nextStatus = resolveDropStatus(String(event.over.id));

      if (!nextStatus) {
        return;
      }

      if (task.status === nextStatus) {
        return;
      }

      setUpdatingTaskId(task.id);

      try {
        await ApiProjectTask.edit(
          task.id,
          buildBoardEditPayload(task, {
            status: nextStatus,
          }),
        );
        message.success('任务状态已更新');
        await invalidateBoardQueries();
      } finally {
        setUpdatingTaskId(undefined);
      }
    } finally {
      setActiveTaskDragId(undefined);
    }
  };

  const handlePriorityChange = async (
    task: AgileBoardTask,
    nextPriority: TaskPriority,
  ) => {
    if (updatingTaskId !== undefined) {
      return;
    }

    if (task.priority === nextPriority) {
      return;
    }

    setUpdatingTaskId(task.id);

    try {
      await ApiProjectTask.edit(
        task.id,
        buildBoardEditPayload(task, {
          priority: nextPriority,
        }),
      );
      message.success('任务优先级已更新');
      await invalidateBoardQueries();
    } finally {
      setUpdatingTaskId(undefined);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 12,
        background: '#f5f7fa',
        boxSizing: 'border-box',
      }}
    >
      <Card size="small">
        <AgileBoardToolbar
          hasFilters={hasFilters}
          projectId={filters.projectId}
          assigneeId={filters.assigneeId}
          priority={filters.priority}
          projectOptions={projectOptions}
          onCreate={async () => {
            await openTaskForm();
          }}
          onTitleSearch={(value) => {
            setFilters((previous) => {
              return {
                ...previous,
                title: value,
              };
            });
          }}
          onProjectChange={(value) => {
            setFilters((previous) => {
              return {
                ...previous,
                projectId: value,
              };
            });
          }}
          onAssigneeChange={(value) => {
            setFilters((previous) => {
              return {
                ...previous,
                assigneeId: value,
              };
            });
          }}
          onPriorityChange={(value) => {
            setFilters((previous) => {
              return {
                ...previous,
                priority: value,
              };
            });
          }}
          onReset={() => {
            setFilters({
              title: '',
            });
          }}
        />
      </Card>

      <Card
        size="small"
        style={{ flex: 1, minHeight: 0 }}
        styles={{
          body: {
            height: '100%',
            minHeight: 0,
            padding: 10,
            background: '#eef2f6',
          },
        }}
      >
        <DndContext
          sensors={sensors}
          onDragStart={(event) => {
            handleDragStart(event);
          }}
          onDragCancel={handleDragCancel}
          onDragEnd={async (event) => {
            await handleDragEnd(event);
          }}
        >
          <div
            style={{
              height: '100%',
              minHeight: 0,
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: 4,
            }}
          >
            <div
              style={{
                display: 'grid',
                height: '100%',
                minHeight: 0,
                gridTemplateColumns: `repeat(${Math.max(
                  agileBoardColumns.length,
                  1,
                )}, minmax(280px, 1fr))`,
                gap: 16,
                minWidth: Math.max(agileBoardColumns.length, 1) * 296,
                alignItems: 'stretch',
              }}
            >
              {agileBoardColumns.map((column) => {
                return (
                  <AgileBoardColumn
                    key={column.status}
                    column={column}
                    disabled={updatingTaskId !== undefined}
                    tasks={groupedTasks[column.status]}
                    onPreview={openTaskPreview}
                    onPriorityChange={handlePriorityChange}
                  />
                );
              })}
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask && <AgileBoardCardPreview task={activeTask} />}
          </DragOverlay>
        </DndContext>
      </Card>
    </div>
  );
}
