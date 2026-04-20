import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Dropdown, Space, message } from 'antd';
import type { MenuProps } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { ApiProject, ApiProjectTask, ApiProjectTaskStatus } from '@/api';
import {
  type ProjectTaskDetail,
  type TaskPriority,
} from '@/api/modules/project-task.types';
import { RequestError } from '@/api/types';
import { useKDrawer } from '@/components/KDrawer';
import { useKModal } from '@/components/KModal';
import useDebounce from '@/hooks/useDebounce';
import { openTaskModal } from '@/service/taskModalService.tsx';
import {
  buildAgileBoardColumns,
  buildBoardQueryParams,
  filterBoardParentTasks,
  groupBoardTasks,
  handleBoardTitleSearch,
} from '../#helper';
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
import AgileBoardV2Column from './#AgileBoardV2Column';
import {
  V2BoardColumnsGrid,
  V2BoardColumnsScroller,
  V2BoardContentCard,
  V2BoardPageRoot,
  V2BoardToolbarCard,
} from './#board-v2.styled';

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
  const [filters, setFilters] = useState<AgileBoardFilterState>({
    title: '',
  });
  const [previewTaskId, setPreviewTaskId] = useState<number>();
  const sharedPreviewOpeningTaskIdRef = useRef<number>();
  const [titleSearchInput, setTitleSearchInput] = useState('');
  const debouncedTitleSearchValue = useDebounce(titleSearchInput, 400);
  const params = useMemo(() => buildBoardQueryParams(filters), [filters]);
  const { data: projectListData } = useQuery({
    queryKey: ['project', 'list', 'agile-board-v2'],
    queryFn: () => ApiProject.getList({ current: 1, pageSize: 999 }),
  });
  const { data: boardTasks = [], refetch: refetchBoardTasks } = useQuery({
    queryKey: ['project', 'task-board', 'agile-board-v2', params],
    queryFn: () => ApiProjectTask.getAgileBoard(params),
  });
  const parentTasks = useMemo(() => {
    return filterBoardParentTasks(boardTasks);
  }, [boardTasks]);
  const { data: statusConfigs = [] } = useQuery({
    queryKey: ['project', 'task-status-list', 'agile-board-v2'],
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
  const agileBoardColumns = useMemo(() => {
    return buildAgileBoardColumns(statusConfigs, parentTasks);
  }, [parentTasks, statusConfigs]);
  const groupedTasks = useMemo(() => {
    return groupBoardTasks(parentTasks, agileBoardColumns);
  }, [agileBoardColumns, parentTasks]);
  const hasFilters = useMemo(() => {
    return Boolean(
      filters.title ||
      filters.projectId !== undefined ||
      filters.assigneeId !== undefined ||
      filters.priority !== undefined,
    );
  }, [filters]);

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
        statusConfigs,
        task,
      });

      if (!submitted) {
        return;
      }

      await refetchBoardTasks();
    },
    [modal, refetchBoardTasks, statusConfigs],
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
          projectId={filters.projectId}
          assigneeId={filters.assigneeId}
          priority={filters.priority}
          projectOptions={projectOptions}
          titleSearchValue={titleSearchInput}
          extraActions={
            <Dropdown.Button
              menu={{
                items: backToV1MenuItems,
                onClick: async (info) => {
                  if (info.key === 'remember-v1') {
                    await handleNavigateToV1(true);
                  }
                },
              }}
              onClick={async () => {
                await handleNavigateToV1(false);
              }}
            >
              切回旧版
            </Dropdown.Button>
          }
          onCreate={handleCreateTask}
          onTitleSearchChange={handleTitleSearchChange}
          onProjectChange={handleProjectChange}
          onAssigneeChange={handleAssigneeChange}
          onPriorityChange={handleFilterPriorityChange}
          onReset={handleResetFilters}
        />
      </V2BoardToolbarCard>

      <V2BoardContentCard size="small">
        <V2BoardColumnsScroller>
          <V2BoardColumnsGrid $columnCount={agileBoardColumns.length}>
            {agileBoardColumns.map((column) => {
              return (
                <AgileBoardV2Column
                  key={column.status}
                  column={column}
                  tasks={groupedTasks[column.status]}
                  onOpenSubtasks={handleOpenSubtasks}
                  onPreview={openTaskPreview}
                />
              );
            })}
          </V2BoardColumnsGrid>
        </V2BoardColumnsScroller>
      </V2BoardContentCard>
    </V2BoardPageRoot>
  );
}
