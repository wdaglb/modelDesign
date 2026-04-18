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
import useDebounce from '@/hooks/useDebounce';
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
  const [titleSearchInput, setTitleSearchInput] = useState('');
  const debouncedTitleSearchValue = useDebounce(titleSearchInput, 400);
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
  /**
   * 稳定父任务 ID 顺序，避免子任务批量查询键在同集合下反复抖动。
   */
  const parentTaskIds = useMemo(() => {
    return [...parentTasks]
      .sort((leftTask, rightTask) => leftTask.id - rightTask.id)
      .map((task) => task.id);
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
  /**
   * 刷新看板与关联列表，用于创建/编辑等影响范围较大的场景。
   */
  const invalidateBoardQueries = useCallback(async () => {
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
  }, [queryClient]);

  /**
   * 刷新看板任务变更最小依赖，避免每次状态/优先级调整都触发任务列表刷新。
   */
  const invalidateBoardMutationQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskBoard(),
      }),
      queryClient.invalidateQueries({
        queryKey: ['projectTaskChildrenBatch'],
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.todo.list(),
      }),
    ]);
  }, [queryClient]);

  /**
   * 统一处理看板任务变更成功反馈，减少重复逻辑。
   */
  const handleBoardTaskMutationSuccess = useCallback(
    async (successMessage: string) => {
      message.success(successMessage);
      await invalidateBoardMutationQueries();
    },
    [invalidateBoardMutationQueries],
  );

  /**
   * 当前看板优先级更新回调，保持引用稳定并收敛刷新范围。
   */
  const handlePriorityChange = useCallback(
    async (task: AgileBoardTask, nextPriority: TaskPriority) => {
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
        await handleBoardTaskMutationSuccess('任务优先级已更新');
      } finally {
        setUpdatingTaskId(undefined);
      }
    },
    [handleBoardTaskMutationSuccess, updatingTaskId],
  );

  /**
   * 当前看板拖拽开始事件。
   */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (updatingTaskId !== undefined) {
        return;
      }

      setActiveTaskDragId(String(event.active.id));
    },
    [updatingTaskId],
  );

  /**
   * 当前看板拖拽取消事件。
   */
  const handleDragCancel = useCallback(() => {
    setActiveTaskDragId(undefined);
  }, []);

  /**
   * 当前看板拖拽结束事件，状态流转后仅刷新必要查询。
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
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
          await handleBoardTaskMutationSuccess('任务状态已更新');
        } finally {
          setUpdatingTaskId(undefined);
        }
      } finally {
        setActiveTaskDragId(undefined);
      }
    },
    [handleBoardTaskMutationSuccess, taskMap, updatingTaskId],
  );
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
  /**
   * 打开任务表单，提交成功后刷新看板与关联列表。
   */
  const openTaskForm = useCallback(
    async (task?: ProjectTaskDetail) => {
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
    },
    [invalidateBoardQueries, modal, setIsTaskFormOpen, statusConfigs],
  );
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

  /**
   * 统一处理标题搜索，命中任务编号时直接打开预览，未命中则更新标题筛选。
   */
  const executeTitleSearch = useCallback(
    async (value: string) => {
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
    },
    [openTaskPreview],
  );

  /**
   * 标题输入值防抖后触发搜索，减少频繁请求与筛选重算。
   */
  useEffect(() => {
    void executeTitleSearch(debouncedTitleSearchValue);
  }, [debouncedTitleSearchValue, executeTitleSearch]);

  /**
   * 标题输入变化事件。
   */
  const handleTitleSearchChange = useCallback((value: string) => {
    setTitleSearchInput(value);
  }, []);

  /**
   * 项目筛选变化事件。
   */
  const handleProjectChange = useCallback((value?: number) => {
    setFilters((previous) => {
      return {
        ...previous,
        projectId: value,
      };
    });
  }, []);

  /**
   * 负责人筛选变化事件。
   */
  const handleAssigneeChange = useCallback((value?: number) => {
    setFilters((previous) => {
      return {
        ...previous,
        assigneeId: value,
      };
    });
  }, []);

  /**
   * 顶部优先级筛选变化事件。
   */
  const handleFilterPriorityChange = useCallback((value?: TaskPriority) => {
    setFilters((previous) => {
      return {
        ...previous,
        priority: value,
      };
    });
  }, []);

  /**
   * 重置筛选条件并清空搜索输入。
   */
  const handleResetFilters = useCallback(() => {
    setTitleSearchInput('');
    setFilters({
      title: '',
    });
  }, []);

  /**
   * 打开新建任务弹窗。
   */
  const handleCreateTask = useCallback(async () => {
    await openTaskForm();
  }, [openTaskForm]);
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
  return (
    <BoardPageRoot>
      <BoardToolbarCard size="small">
        <AgileBoardToolbar
          hasFilters={hasFilters}
          projectId={filters.projectId}
          assigneeId={filters.assigneeId}
          priority={filters.priority}
          projectOptions={projectOptions}
          titleSearchValue={titleSearchInput}
          onCreate={handleCreateTask}
          onTitleSearchChange={handleTitleSearchChange}
          onProjectChange={handleProjectChange}
          onAssigneeChange={handleAssigneeChange}
          onPriorityChange={handleFilterPriorityChange}
          onReset={handleResetFilters}
        />
      </BoardToolbarCard>
      <BoardContentCard size="small">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
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
