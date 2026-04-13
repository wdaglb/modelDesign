import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { message } from 'antd';
import { z } from 'zod';
import { ApiProject, ApiProjectTask, ApiProjectTaskStatus } from '@/api';
import {
  TaskPriority,
  type ProjectTaskDetail,
} from '@/api/modules/project-task.types';
import { RequestError } from '@/api/types';
import { useKDrawer } from '@/components/KDrawer';
import { useKModal } from '@/components/KModal';
import queryKey from '@/constants/queryKey';
import { openTaskModal } from '@/service/taskModalService.tsx';
import { AgileBoardTaskCardPreview } from './components/AgileBoardTaskCard';
import AgileBoardColumn from './components/BoardColumn';
import AgileBoardToolbar from './components/BoardToolbar';
import { openTaskPreviewDrawer } from './#previewDrawerService';
import useBoardAutoRefresh from './#useBoardAutoRefresh';
import {
  buildAgileBoardColumns,
  buildBoardEditPayload,
  buildBoardQueryParams,
  filterBoardParentTasks,
  getTaskDragId,
  groupBoardTasks,
  groupBoardSubtasks,
  handleBoardTitleSearch,
  resolveDropStatus,
} from './#helper';
import type { AgileBoardFilterState, AgileBoardTask } from './#types';
import {
  BoardColumnsGrid,
  BoardColumnsScroller,
  BoardContentCard,
  BoardPageRoot,
  BoardToolbarCard,
} from './styles/board.styled';

const searchSchema = z.object({
  taskId: z.coerce.number().optional(),
});

export const Route = createFileRoute('/agile-board/')({
  validateSearch: searchSchema,
  component: RouteComponent,
});

/**
 * 敏捷面板页面。
 */
function RouteComponent() {
  const drawer = useKDrawer();
  const modal = useKModal();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
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
  const { data: boardTasks = [], refetch: refetchBoardTasks } = useQuery({
    queryKey: [...queryKey.project.taskBoard(), params],
    queryFn: () => ApiProjectTask.getAgileBoard(params),
  });
  const parentTasks = useMemo(() => {
    return filterBoardParentTasks(boardTasks);
  }, [boardTasks]);
  const parentTaskIds = useMemo(() => {
    return parentTasks.map((task) => task.id);
  }, [parentTasks]);
  const { data: childrenBatch } = useQuery({
    queryKey: queryKey.project.taskChildrenBatch(parentTaskIds),
    queryFn: () => ApiProjectTask.getChildrenBatch(parentTaskIds),
    enabled: parentTaskIds.length > 0,
  });
  const { data: statusConfigs = [] } = useQuery({
    queryKey: queryKey.project.taskStatusList(),
    queryFn: () => ApiProjectTaskStatus.getList(),
  });
  const projectOptions = useMemo(() => {
    const items = projectListData?.items;

    if (!items) {
      return [];
    }

    return items.map((item) => ({
      label: item.name,
      value: item.id,
    }));
  }, [projectListData]);
  const agileBoardColumns = useMemo(
    () => buildAgileBoardColumns(statusConfigs, parentTasks),
    [statusConfigs, parentTasks],
  );
  const groupedTasks = useMemo(
    () => groupBoardTasks(parentTasks, agileBoardColumns),
    [parentTasks, agileBoardColumns],
  );
  const subtaskMap = useMemo(() => {
    let subtasks: AgileBoardTask[] = [];

    if (childrenBatch) {
      subtasks = childrenBatch as AgileBoardTask[];
    }

    return groupBoardSubtasks(subtasks);
  }, [childrenBatch]);
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
    parentTasks.forEach((task) => {
      nextTaskMap.set(getTaskDragId(task.id), task);
    });
    return nextTaskMap;
  }, [parentTasks]);
  const activeTask = useMemo(() => {
    if (!activeTaskDragId) {
      return undefined;
    }
    return taskMap.get(activeTaskDragId);
  }, [activeTaskDragId, taskMap]);
  const activeTaskAccentColor = useMemo(() => {
    if (!activeTask) {
      return undefined;
    }

    const matchedColumn = agileBoardColumns.find((column) => {
      return column.status === activeTask.status;
    });

    if (!matchedColumn) {
      return undefined;
    }

    return matchedColumn.accentColor;
  }, [activeTask, agileBoardColumns]);
  const { setIsTaskFormOpen } = useBoardAutoRefresh({
    activeTaskDragId,
    previewTaskId,
    refetchBoardTasks: async () => {
      await refetchBoardTasks();
    },
  });
  const invalidateBoardQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskBoard(),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskList(),
      }),
      queryClient.invalidateQueries({
        queryKey: ['projectTaskChildrenBatch'],
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.todo.list(),
      }),
    ]);
  };
  const clearPreviewSearch = useCallback(async () => {
    await navigate({
      to: '/agile-board/',
      search: {},
      replace: true,
    });
  }, [navigate]);
  const syncPreviewSearch = useCallback(
    async (task: ProjectTaskDetail) => {
      await navigate({
        to: '/agile-board/',
        search: {
          taskId: task.id,
        },
        replace: true,
      });
    },
    [navigate],
  );
  const openTaskForm = async (task?: ProjectTaskDetail) => {
    setIsTaskFormOpen(true);

    try {
      const submitted = await openTaskModal(modal, {
        statusConfigs,
        task,
      });

      if (!submitted) {
        return;
      }

      await invalidateBoardQueries();
    } finally {
      setIsTaskFormOpen(false);
    }
  };
  const openTaskPreview = useCallback(
    async (
      task: ProjectTaskDetail,
      options?: {
        syncSearchOnOpen?: boolean;
      },
    ) => {
      if (previewTaskId !== undefined) {
        return;
      }

      let syncSearchOnOpen = true;
      if (options && options.syncSearchOnOpen === false) {
        syncSearchOnOpen = false;
      }

      setPreviewTaskId(task.id);

      try {
        if (syncSearchOnOpen) {
          await syncPreviewSearch(task);
        }

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
        await clearPreviewSearch();
        setPreviewTaskId(undefined);
      }
    },
    [
      clearPreviewSearch,
      drawer,
      invalidateBoardQueries,
      openTaskForm,
      previewTaskId,
      statusConfigs,
      syncPreviewSearch,
    ],
  );
  useEffect(() => {
    if (previewTaskId !== undefined) {
      return;
    }

    if (search.taskId === undefined) {
      return;
    }

    let cancelled = false;

    const openSharedTask = async () => {
      try {
        const sharedTask = await ApiProjectTask.getDetail(search.taskId);

        if (cancelled) {
          return;
        }

        await openTaskPreview(sharedTask, {
          syncSearchOnOpen: false,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        await clearPreviewSearch();

        if (error instanceof RequestError && error.code === 404) {
          message.error('分享任务不存在或已删除');
          return;
        }

        message.error('分享任务打开失败，请稍后重试');
      }
    };

    void openSharedTask();

    return () => {
      cancelled = true;
    };
  }, [
    clearPreviewSearch,
    openTaskPreview,
    previewTaskId,
    search.taskId,
  ]);
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
    <BoardPageRoot>
      <BoardToolbarCard size="small">
        <AgileBoardToolbar
          hasFilters={hasFilters}
          projectId={filters.projectId}
          assigneeId={filters.assigneeId}
          priority={filters.priority}
          projectOptions={projectOptions}
          onCreate={async () => {
            await openTaskForm();
          }}
          onTitleSearch={async (value) => {
            try {
              await handleBoardTitleSearch(value, {
                getDetailByCode: ApiProjectTask.getDetailByCode,
                onOpenPreview: async (task) => {
                  await openTaskPreview(task);
                },
                onFallbackSearch: (title) => {
                  setFilters((previous) => {
                    return {
                      ...previous,
                      title,
                    };
                  });
                },
              });
            } catch (error) {
              if (error instanceof RequestError) {
                return;
              }

              message.error('任务搜索失败，请稍后重试');
            }
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
      </BoardToolbarCard>
      <BoardContentCard size="small">
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
          <BoardColumnsScroller>
            <BoardColumnsGrid $columnCount={agileBoardColumns.length}>
              {agileBoardColumns.map((column) => {
                return (
                  <AgileBoardColumn
                    key={column.status}
                    column={column}
                    disabled={updatingTaskId !== undefined}
                    tasks={groupedTasks[column.status]}
                    subtaskMap={subtaskMap}
                    onPreview={openTaskPreview}
                    onPriorityChange={handlePriorityChange}
                  />
                );
              })}
            </BoardColumnsGrid>
          </BoardColumnsScroller>
          <DragOverlay dropAnimation={null}>
            {activeTask && (
              <AgileBoardTaskCardPreview
                task={activeTask}
                accentColor={activeTaskAccentColor}
              />
            )}
          </DragOverlay>
        </DndContext>
      </BoardContentCard>
    </BoardPageRoot>
  );
}
