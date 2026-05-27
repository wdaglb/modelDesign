import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Button, Empty, Tour, message } from 'antd';
import { z } from 'zod';
import {
  ApiProject,
  ApiProjectTask,
  ApiProjectTaskIteration,
  ApiProjectTaskStatus,
  ApiProjectTaskType,
} from '@/api';
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
import TaskIterationManager from './#TaskIterationManager';
import AgileBoardColumn from './components/BoardColumn';
import AgileBoardToolbar from './components/BoardToolbar';
import {
  openTaskPreviewDrawer,
  type TaskPreviewDrawerTabKey,
} from './#previewDrawerService';
import useBoardAutoRefresh from './#useBoardAutoRefresh';
import {
  buildAgileBoardColumns,
  buildBoardEditPayload,
  buildBoardQueryParams,
  filterBoardParentTasks,
  getTaskDragId,
  groupBoardTasks,
  handleBoardTitleSearch,
  resolveDropStatus,
} from './#helper';
import { resolveDefaultBoardIteration } from './#iterationHelper';
import {
  buildAgileBoardVersionSearch,
  getPreferredAgileBoardVersionFromStorage,
  hasSeenAgileBoardV2Tour,
  markAgileBoardV2TourAsSeen,
  savePreferredAgileBoardVersionToStorage,
  shouldAutoRedirectToAgileBoardV2,
} from './#boardVersionPreference';
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
  const enterV2ButtonRef = useRef<HTMLDivElement>(null);
  const sharedPreviewOpeningTaskIdRef = useRef<number>();
  const [activeTaskDragId, setActiveTaskDragId] = useState<string>();
  const [preferredBoardVersion, setPreferredBoardVersion] = useState(() => {
    return getPreferredAgileBoardVersionFromStorage();
  });
  const [isV2TourOpen, setIsV2TourOpen] = useState(false);
  const [isIterationInitialized, setIsIterationInitialized] = useState(false);
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
  const {
    data: taskIterations = [],
    isFetched: isTaskIterationFetched,
    refetch: refetchTaskIterations,
  } = useQuery({
    queryKey: queryKey.project.taskIterationList(),
    queryFn: () => ApiProjectTaskIteration.getList(),
  });
  const hasTaskIterations = taskIterations.length > 0;
  const { data: boardTasks = [], refetch: refetchBoardTasks } = useQuery({
    queryKey: [...queryKey.project.taskBoard(), params],
    queryFn: () => ApiProjectTask.getAgileBoard(params),
    enabled: isIterationInitialized && hasTaskIterations,
  });
  const parentTasks = useMemo(() => {
    return filterBoardParentTasks(boardTasks);
  }, [boardTasks]);
  const { data: statusConfigs = [] } = useQuery({
    queryKey: queryKey.project.taskStatusList(),
    queryFn: () => ApiProjectTaskStatus.getList(),
  });
  const { data: taskTypes = [] } = useQuery({
    queryKey: queryKey.project.taskTypeList(),
    queryFn: () => ApiProjectTaskType.getList(),
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
  const iterationOptions = useMemo(() => {
    return taskIterations.map((item) => {
      return {
        label: `${item.name}（${item.startDate} ~ ${item.endDate}）`,
        value: item.id,
      };
    });
  }, [taskIterations]);
  const agileBoardColumns = useMemo(
    () => buildAgileBoardColumns(statusConfigs, parentTasks),
    [statusConfigs, parentTasks],
  );
  const groupedTasks = useMemo(
    () => groupBoardTasks(parentTasks, agileBoardColumns),
    [parentTasks, agileBoardColumns],
  );
  const hasFilters = useMemo(() => {
    return Boolean(
      filters.title ||
      filters.iterationId !== undefined ||
      filters.projectId !== undefined ||
      filters.assigneeId !== undefined ||
      filters.priority !== undefined,
    );
  }, [filters]);

  /**
   * 首次加载迭代后初始化默认看板迭代。
   *
   * 没有迭代时只标记初始化完成，页面会展示创建引导而不请求任务列表。
   */
  useEffect(() => {
    if (isIterationInitialized) {
      return;
    }

    if (!isTaskIterationFetched) {
      return;
    }

    const defaultIteration = resolveDefaultBoardIteration(taskIterations);
    if (!defaultIteration) {
      setIsIterationInitialized(true);
      return;
    }

    setFilters((previous) => {
      return {
        ...previous,
        iterationId: defaultIteration.id,
      };
    });
    setIsIterationInitialized(true);
  }, [isIterationInitialized, isTaskIterationFetched, taskIterations]);

  /**
   * 迭代被删除后，如果当前筛选值已不存在，则回落到新的默认迭代。
   */
  useEffect(() => {
    if (!isIterationInitialized || !isTaskIterationFetched) {
      return;
    }

    if (taskIterations.length === 0) {
      if (filters.iterationId === undefined) {
        return;
      }
      setFilters((previous) => {
        return {
          ...previous,
          iterationId: undefined,
        };
      });
      return;
    }

    if (filters.iterationId === undefined) {
      return;
    }

    const currentIterationExists = taskIterations.some((item) => {
      return item.id === filters.iterationId;
    });
    if (currentIterationExists) {
      return;
    }

    const defaultIteration = resolveDefaultBoardIteration(taskIterations);
    setFilters((previous) => {
      return {
        ...previous,
        iterationId: defaultIteration?.id,
      };
    });
  }, [
    filters.iterationId,
    isIterationInitialized,
    isTaskIterationFetched,
    taskIterations,
  ]);

  /**
   * 当用户已明确记住 v2 时，进入旧版后自动跳到 v2。
   *
   * 这里保留 taskId，确保从分享链接或详情抽屉状态切换版本时不丢上下文。
   */
  useEffect(() => {
    if (!shouldAutoRedirectToAgileBoardV2()) {
      return;
    }

    void navigate({
      to: '/agile-board/v2',
      search: buildAgileBoardVersionSearch(search.taskId),
      replace: true,
    });
  }, [navigate, search.taskId]);

  /**
   * 旧版首次进入时自动展示 v2 引导。
   *
   * 这里要求“未记住 v2 且未展示过 Tour”才打开，避免重复打扰。
   */
  useEffect(() => {
    if (preferredBoardVersion === 'v2') {
      return;
    }

    if (hasSeenAgileBoardV2Tour()) {
      return;
    }

    setIsV2TourOpen(true);
  }, [preferredBoardVersion]);

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
        queryKey: queryKey.todo.list(),
      }),
    ]);
  }, [queryClient]);

  /**
   * 刷新迭代配置与看板数据，供迭代管理弹窗在变更后统一调用。
   */
  const refreshIterationAndBoard = useCallback(async () => {
    const iterationResult = await refetchTaskIterations();
    const refreshedIterations = iterationResult.data ?? [];
    if (filters.iterationId === undefined && refreshedIterations.length > 0) {
      const defaultIteration = resolveDefaultBoardIteration(refreshedIterations);
      setFilters((previous) => {
        if (previous.iterationId !== undefined) {
          return previous;
        }
        return {
          ...previous,
          iterationId: defaultIteration?.id,
        };
      });
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskBoard(),
      }),
    ]);
  }, [filters.iterationId, queryClient, refetchTaskIterations]);

  /**
   * 刷新看板任务变更最小依赖，避免每次状态/优先级调整都触发任务列表刷新。
   */
  const invalidateBoardMutationQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskBoard(),
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
      to: '/agile-board',
      search: {},
      replace: true,
    });
  }, [navigate]);
  const syncPreviewSearch = useCallback(
    async (task: ProjectTaskDetail) => {
      await navigate({
        to: '/agile-board',
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
          defaultIterationId: filters.iterationId,
          iterations: taskIterations,
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
    [
      filters.iterationId,
      invalidateBoardQueries,
      modal,
      setIsTaskFormOpen,
      statusConfigs,
      taskIterations,
    ],
  );
  const openTaskPreview = useCallback(
    async (
      task: ProjectTaskDetail,
      options?: {
        initialTabKey?: TaskPreviewDrawerTabKey;
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
      const initialTabKey = options?.initialTabKey;

      setPreviewTaskId(task.id);

      try {
        if (syncSearchOnOpen) {
          await syncPreviewSearch(task);
        }

        await openTaskPreviewDrawer(drawer, {
          taskId: task.id,
          statusConfigs,
          initialTabKey,
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
   * 直接打开任务详情抽屉中的子任务区域，替代看板卡片内联子任务展开。
   */
  const handleOpenSubtasks = useCallback(
    async (task: AgileBoardTask) => {
      await openTaskPreview(task, {
        initialTabKey: 'subtask',
      });
    },
    [openTaskPreview],
  );

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
   * 迭代筛选变化事件。
   */
  const handleIterationChange = useCallback((value?: number) => {
    setFilters((previous) => {
      return {
        ...previous,
        iterationId: value,
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
   * 打开敏捷面板内的迭代管理弹窗。
   */
  const handleManageIterations = useCallback(async () => {
    try {
      await modal.open({
        title: '管理迭代',
        width: 760,
        children: <TaskIterationManager onRefresh={refreshIterationAndBoard} />,
      });
    } catch (error) {
      if (error !== 'KModal cancel') {
        throw error;
      }
    }
  }, [modal, refreshIterationAndBoard]);

  /**
   * 打开新建任务弹窗。
   */
  const handleCreateTask = useCallback(async () => {
    await openTaskForm();
  }, [openTaskForm]);

  /**
   * 跳转到 v2，并按需记住后续默认入口偏好。
   */
  const handleNavigateToV2 = useCallback(
    async (rememberVersion: boolean) => {
      if (rememberVersion) {
        savePreferredAgileBoardVersionToStorage('v2');
        setPreferredBoardVersion('v2');
      }

      await navigate({
        to: '/agile-board/v2',
        search: buildAgileBoardVersionSearch(search.taskId),
      });
    },
    [navigate, search.taskId],
  );

  /**
   * 关闭 v2 引导并记录为已展示，避免每次进入旧版都重复弹出。
   */
  const handleCloseV2Tour = useCallback(() => {
    markAgileBoardV2TourAsSeen();
    setIsV2TourOpen(false);
  }, []);
  useEffect(() => {
    if (search.taskId === undefined) {
      /**
       * 地址栏中的 taskId 被清除后，同步释放进行中标记，
       * 避免下次通过链接再次进入时被旧状态误判为已在打开。
       */
      sharedPreviewOpeningTaskIdRef.current = undefined;
      return;
    }

    if (previewTaskId !== undefined) {
      return;
    }

    /**
     * 分享任务的自动打开流程会先请求详情，再异步打开抽屉。
     * 在这段窗口期内，若 effect 因依赖变化再次执行，就会重复请求同一个详情接口。
     */
    if (sharedPreviewOpeningTaskIdRef.current === search.taskId) {
      return;
    }

    sharedPreviewOpeningTaskIdRef.current = search.taskId;

    let cancelled = false;

    const openSharedTask = async () => {
      try {
        const sharedTask = await ApiProjectTask.getDetail(search.taskId!);

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

        sharedPreviewOpeningTaskIdRef.current = undefined;
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
  }, [clearPreviewSearch, openTaskPreview, previewTaskId, search.taskId]);
  return (
    <BoardPageRoot>
      <Tour
        open={isV2TourOpen}
        onClose={handleCloseV2Tour}
        steps={[
          {
            title: '试试高性能新版面板',
            target: () => enterV2ButtonRef.current,
            description:
              '点击“进入新版”可直接体验 v2；展开右侧下拉菜单可选择“进入新版并记住”，之后再访问旧版时会自动跳到 v2。',
          },
        ]}
      />

      <BoardToolbarCard size="small">
        <AgileBoardToolbar
          hasFilters={hasFilters}
          iterationId={filters.iterationId}
          iterationOptions={iterationOptions}
          projectId={filters.projectId}
          assigneeId={filters.assigneeId}
          priority={filters.priority}
          projectOptions={projectOptions}
          titleSearchValue={titleSearchInput}
          enterV2ButtonRef={enterV2ButtonRef}
          onCreate={handleCreateTask}
          onEnterV2={async () => {
            await handleNavigateToV2(false);
          }}
          onEnterV2AndRemember={async () => {
            await handleNavigateToV2(true);
          }}
          onTitleSearchChange={handleTitleSearchChange}
          onProjectChange={handleProjectChange}
          onAssigneeChange={handleAssigneeChange}
          onIterationChange={handleIterationChange}
          onManageIterations={handleManageIterations}
          onPriorityChange={handleFilterPriorityChange}
          onReset={handleResetFilters}
        />
      </BoardToolbarCard>
      <BoardContentCard size="small">
        {isTaskIterationFetched && !hasTaskIterations && (
          <Empty
            description="暂无任务迭代，请先创建迭代后再使用敏捷面板"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handleManageIterations}>
              创建迭代
            </Button>
          </Empty>
        )}

        {hasTaskIterations && (
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
                      taskTypes={taskTypes}
                      onOpenSubtasks={handleOpenSubtasks}
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
                  taskTypes={taskTypes}
                  accentColor={activeTaskAccentColor}
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </BoardContentCard>
    </BoardPageRoot>
  );
}
