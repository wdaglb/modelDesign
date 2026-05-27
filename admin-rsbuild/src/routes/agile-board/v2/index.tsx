import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Button, Dropdown, Empty, Space, message } from 'antd';
import type { MenuProps } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import {
  ApiProject,
  ApiProjectTask,
  ApiProjectTaskIteration,
  ApiProjectTaskStatus,
  ApiProjectTaskType,
} from '@/api';
import {
  type ProjectTaskDetail,
  type TaskPriority,
} from '@/api/modules/project-task.types';
import { RequestError } from '@/api/types';
import { useKDrawer } from '@/components/KDrawer';
import { useKModal } from '@/components/KModal';
import queryKey from '@/constants/queryKey';
import useDebounce from '@/hooks/useDebounce';
import { openTaskModal } from '@/service/taskModalService.tsx';
import TaskIterationManager from '../#TaskIterationManager';
import {
  buildAgileBoardColumns,
  buildBoardEditPayload,
  buildBoardQueryParams,
  filterBoardParentTasks,
  groupBoardTasks,
  handleBoardTitleSearch,
} from '../#helper';
import { resolveDefaultBoardIteration } from '../#iterationHelper';
import {
  buildAgileBoardVersionSearch,
  savePreferredAgileBoardVersionToStorage,
} from '../#boardVersionPreference';
import {
  openTaskPreviewDrawer,
  type TaskPreviewDrawerTabKey,
} from '../#previewDrawerService';
import type { AgileBoardFilterState, AgileBoardTask } from '../#types';
import AgileBoardToolbar from '../components/BoardToolbar';
import AgileBoardV2Column, {
  AgileBoardV2TaskCardPreview,
} from './#AgileBoardV2Column';
import {
  buildAgileBoardTaskMap,
  resolveAgileBoardDropChange,
} from './#boardV2DragHelper';
import {
  V2BoardColumnsGrid,
  V2BoardColumnsScroller,
  V2BoardContentCard,
  V2BoardPageRoot,
  V2BoardToolbarCard,
} from './#board-v2.styled';

const EMPTY_TASKS: AgileBoardTask[] = [];
const EMPTY_ITERATIONS: Awaited<
  ReturnType<typeof ApiProjectTaskIteration.getList>
> = [];
const EMPTY_STATUS_CONFIGS: Awaited<
  ReturnType<typeof ApiProjectTaskStatus.getList>
> = [];
const EMPTY_TASK_TYPES: Awaited<
  ReturnType<typeof ApiProjectTaskType.getList>
> = [];

const searchSchema = z.object({
  taskId: z.coerce.number().optional(),
});

export const Route = createFileRoute('/agile-board/v2/')({
  validateSearch: searchSchema,
  component: RouteComponent,
});

/**
 * 高性能版敏捷面板页面。
 *
 * 设计目标：
 * - 保留现有筛选、创建、预览等核心业务能力，方便横向对比；
 * - 去掉拖拽与通用大卡片包装，减少频繁重排与事件绑定压力；
 * - 使用固定高度卡片与列内原生滚动，解决末卡被遮挡和列滚动不稳定问题。
 */
function RouteComponent() {
  const drawer = useKDrawer();
  const modal = useKModal();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const [isIterationInitialized, setIsIterationInitialized] = useState(false);
  const [filters, setFilters] = useState<AgileBoardFilterState>({
    title: '',
  });
  const [previewTaskId, setPreviewTaskId] = useState<number>();
  const [activeTaskDragId, setActiveTaskDragId] = useState<string>();
  const [updatingTaskId, setUpdatingTaskId] = useState<number>();
  const sharedPreviewOpeningTaskIdRef = useRef<number>();
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
    queryKey: ['project', 'list', 'agile-board-v2'],
    queryFn: () => ApiProject.getList({ current: 1, pageSize: 999 }),
  });
  const {
    data: taskIterations = EMPTY_ITERATIONS,
    isFetched: isTaskIterationFetched,
    refetch: refetchTaskIterations,
  } = useQuery({
    queryKey: queryKey.project.taskIterationList(),
    queryFn: () => ApiProjectTaskIteration.getList(),
  });
  const hasTaskIterations = taskIterations.length > 0;
  const {
    data: boardTasks = EMPTY_TASKS,
    refetch: refetchBoardTasks,
  } = useQuery({
    queryKey: ['project', 'task-board', 'agile-board-v2', params],
    queryFn: () => ApiProjectTask.getAgileBoard(params),
    enabled: isIterationInitialized && hasTaskIterations,
  });
  const parentTasks = useMemo(() => {
    return filterBoardParentTasks(boardTasks);
  }, [boardTasks]);
  const { data: statusConfigs = EMPTY_STATUS_CONFIGS } = useQuery({
    queryKey: ['project', 'task-status-list', 'agile-board-v2'],
    queryFn: () => ApiProjectTaskStatus.getList(),
  });
  const { data: taskTypes = EMPTY_TASK_TYPES } = useQuery({
    queryKey: ['project', 'task-type-list', 'agile-board-v2'],
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
  const agileBoardColumns = useMemo(() => {
    return buildAgileBoardColumns(statusConfigs, parentTasks);
  }, [parentTasks, statusConfigs]);
  const groupedTasks = useMemo(() => {
    return groupBoardTasks(parentTasks, agileBoardColumns);
  }, [agileBoardColumns, parentTasks]);
  const taskMap = useMemo(() => {
    return buildAgileBoardTaskMap(parentTasks);
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
   * 状态拖拽成功后只刷新必要缓存，既保证 v2 即时同步，也兼顾旧版与待办页。
   */
  const invalidateBoardMutationQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['project', 'task-board', 'agile-board-v2'],
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskBoard(),
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
        queryKey: ['project', 'task-board', 'agile-board-v2'],
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.project.taskBoard(),
      }),
    ]);
  }, [filters.iterationId, queryClient, refetchTaskIterations]);

  /**
   * 统一处理 v2 看板状态流转成功提示，避免拖拽分支重复编写刷新逻辑。
   */
  const handleBoardTaskMutationSuccess = useCallback(
    async (successMessage: string) => {
      message.success(successMessage);
      await invalidateBoardMutationQueries();
    },
    [invalidateBoardMutationQueries],
  );

  /**
   * 分享链接与页面自身路由需要保持一致，否则从 v2 打开任务时会回落到旧页面。
   */
  const clearPreviewSearch = useCallback(async () => {
    await navigate({
      to: '/agile-board/v2',
      search: {},
      replace: true,
    });
  }, [navigate]);

  /**
   * 把当前打开的任务 ID 同步到 URL，便于直接复制或刷新后恢复。
   */
  const syncPreviewSearch = useCallback(
    async (task: ProjectTaskDetail) => {
      await navigate({
        to: '/agile-board/v2',
        search: {
          taskId: task.id,
        },
        replace: true,
      });
    },
    [navigate],
  );

  /**
   * 打开任务表单，提交成功后刷新高性能版看板数据。
   */
  const openTaskForm = useCallback(
    async (task?: ProjectTaskDetail) => {
      const submitted = await openTaskModal(modal, {
        defaultIterationId: filters.iterationId,
        iterations: taskIterations,
        statusConfigs,
        task,
      });

      if (!submitted) {
        return;
      }

      await refetchBoardTasks();
    },
    [
      filters.iterationId,
      modal,
      refetchBoardTasks,
      statusConfigs,
      taskIterations,
    ],
  );

  /**
   * 记录当前拖拽中的任务，供浮层与自动刷新控制共用。
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
   * 用户取消拖拽时清理浮层状态，避免旧卡片残留在视图上。
   */
  const handleDragCancel = useCallback(() => {
    setActiveTaskDragId(undefined);
  }, []);

  /**
   * 结束拖拽后仅在跨列成功落点时提交状态更新。
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      try {
        if (updatingTaskId !== undefined) {
          return;
        }

        const dropChange = resolveAgileBoardDropChange(
          String(event.active.id),
          event.over ? String(event.over.id) : undefined,
          taskMap,
        );

        if (!dropChange) {
          return;
        }

        setUpdatingTaskId(dropChange.task.id);

        try {
          await ApiProjectTask.edit(
            dropChange.task.id,
            buildBoardEditPayload(dropChange.task, {
              status: dropChange.nextStatus,
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

  /**
   * 打开任务详情抽屉，并维持 v2 自身的地址状态。
   */
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

      setPreviewTaskId(task.id);

      try {
        if (syncSearchOnOpen) {
          await syncPreviewSearch(task);
        }

        await openTaskPreviewDrawer(drawer, {
          taskId: task.id,
          iterations: taskIterations,
          statusConfigs,
          initialTabKey: options?.initialTabKey,
          onTaskUpdated: async () => {
            await refetchBoardTasks();
          },
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
      openTaskForm,
      previewTaskId,
      refetchBoardTasks,
      statusConfigs,
      syncPreviewSearch,
      taskIterations,
    ],
  );

  /**
   * 复用现有编号搜索逻辑，避免 v2 和旧版出现两套行为分叉。
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
              if (previous.title === title) {
                return previous;
              }
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
   * 输入防抖后再触发筛选，避免每次键入都重绘所有列。
   */
  useEffect(() => {
    void executeTitleSearch(debouncedTitleSearchValue);
  }, [debouncedTitleSearchValue, executeTitleSearch]);

  /**
   * 页面支持通过 query 参数直接打开任务详情，便于从通知或分享链接跳转。
   */
  useEffect(() => {
    if (search.taskId === undefined) {
      /**
       * 移除 taskId 后立即清空进行中标记，
       * 让后续再次通过分享链接进入时仍可触发一次自动打开。
       */
      sharedPreviewOpeningTaskIdRef.current = undefined;
      return;
    }

    if (previewTaskId !== undefined) {
      return;
    }

    /**
     * v2 页面同样存在“先拉详情、再开抽屉”的窗口期，
     * 需要阻止同一个 taskId 在 effect 重跑时重复请求详情。
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

  /**
   * 为了降低心智负担，筛选交互继续沿用现有工具栏。
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
   * 优先级筛选变化事件。
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
   * 重置筛选条件。
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
   * 从轻量卡片进入子任务 Tab，保持和旧版一致的查看路径。
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
   * 打开新建任务弹窗。
   */
  const handleCreateTask = useCallback(async () => {
    await openTaskForm();
  }, [openTaskForm]);

  /**
   * 切换回旧版，并按需覆盖后续默认入口偏好。
   */
  const handleNavigateToV1 = useCallback(
    async (rememberVersion: boolean) => {
      if (rememberVersion) {
        savePreferredAgileBoardVersionToStorage('v1');
      }

      await navigate({
        to: '/agile-board',
        search: buildAgileBoardVersionSearch(search.taskId),
      });
    },
    [navigate, search.taskId],
  );

  /**
   * 旧版切换菜单。
   *
   * 使用 Ant Design 原生下拉按钮，保持与旧版“进入新版”一致的交互风格，
   * 同时避免继续使用提示条承载版本切换。
   */
  const backToV1MenuItems = useMemo<MenuProps['items']>(() => {
    return [
      {
        key: 'remember-v1',
        label: '切回旧版并记住',
      },
    ];
  }, []);

  return (
    <V2BoardPageRoot>
      <V2BoardToolbarCard size="small">
        <AgileBoardToolbar
          hasFilters={hasFilters}
          iterationId={filters.iterationId}
          iterationOptions={iterationOptions}
          projectId={filters.projectId}
          assigneeId={filters.assigneeId}
          priority={filters.priority}
          projectOptions={projectOptions}
          titleSearchValue={titleSearchInput}
          extraActions={
            <Space.Compact>
              <Button
                onClick={async () => {
                  await handleNavigateToV1(false);
                }}
              >
                切回旧版
              </Button>
              <Dropdown
                menu={{
                  items: backToV1MenuItems,
                  onClick: async (info) => {
                    if (info.key === 'remember-v1') {
                      await handleNavigateToV1(true);
                    }
                  },
                }}
              >
                <Button>更多</Button>
              </Dropdown>
            </Space.Compact>
          }
          onCreate={handleCreateTask}
          onTitleSearchChange={handleTitleSearchChange}
          onProjectChange={handleProjectChange}
          onAssigneeChange={handleAssigneeChange}
          onIterationChange={handleIterationChange}
          onManageIterations={handleManageIterations}
          onPriorityChange={handleFilterPriorityChange}
          onReset={handleResetFilters}
        />
      </V2BoardToolbarCard>

      <V2BoardContentCard size="small">
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
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
          >
            <V2BoardColumnsScroller>
              <V2BoardColumnsGrid $columnCount={agileBoardColumns.length}>
                {agileBoardColumns.map((column) => {
                  return (
                    <AgileBoardV2Column
                      key={column.status}
                      column={column}
                      disabled={updatingTaskId !== undefined}
                      tasks={groupedTasks[column.status]}
                      taskTypes={taskTypes}
                      onOpenSubtasks={handleOpenSubtasks}
                      onPreview={openTaskPreview}
                    />
                  );
                })}
              </V2BoardColumnsGrid>
            </V2BoardColumnsScroller>
            <DragOverlay dropAnimation={null}>
              {activeTask && activeTaskAccentColor && (
                <AgileBoardV2TaskCardPreview
                  accentColor={activeTaskAccentColor}
                  task={activeTask}
                  taskTypes={taskTypes}
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </V2BoardContentCard>
    </V2BoardPageRoot>
  );
}
