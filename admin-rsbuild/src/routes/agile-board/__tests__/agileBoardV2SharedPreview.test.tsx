import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
import { useKDrawer } from '@/components/KDrawer';
import { useKModal } from '@/components/KModal';

import { Route } from '../v2/index';

const routeMocks = vi.hoisted(() => {
  return {
    navigate: vi.fn(),
    search: {} as { taskId?: number },
  };
});

const previewDrawerMocks = vi.hoisted(() => {
  return {
    openTaskPreviewDrawer: vi.fn(async (drawer, options) => {
      await drawer.open({
        taskId: options.taskId,
      });
    }),
  };
});

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();

  return {
    ...actual,
    createFileRoute: () => {
      return (options: Record<string, unknown>) => {
        return {
          options,
          useNavigate: () => routeMocks.navigate,
          useSearch: () => routeMocks.search,
        };
      };
    },
  };
});

vi.mock('@/api', () => {
  return {
    ApiProject: {
      getList: vi.fn(),
    },
    ApiProjectTask: {
      edit: vi.fn(),
      getAgileBoard: vi.fn(),
      getDetail: vi.fn(),
      getDetailByCode: vi.fn(),
    },
    ApiProjectTaskIteration: {
      getList: vi.fn(),
    },
    ApiProjectTaskStatus: {
      getList: vi.fn(),
    },
    ApiProjectTaskType: {
      getList: vi.fn(),
    },
  };
});

vi.mock('@/components/KDrawer', () => {
  return {
    useKDrawer: vi.fn(),
  };
});

vi.mock('@/components/KModal', () => {
  return {
    useKModal: vi.fn(),
  };
});

vi.mock('@/hooks/useDebounce', () => {
  return {
    default: (value: string) => value,
  };
});

vi.mock('@/service/taskModalService.tsx', () => {
  return {
    openTaskModal: vi.fn(),
  };
});

vi.mock('@/components', () => {
  return {
    UserSelect: () => null,
  };
});

vi.mock('@/store/auth.ts', () => {
  return {
    default: vi.fn((selector) => {
      return selector({
        currentInfo: undefined,
        permissions: [],
      });
    }),
  };
});

vi.mock('@/utils/request', () => {
  return {
    default: vi.fn(),
  };
});

vi.mock('../#previewDrawerService', () => {
  return {
    openTaskPreviewDrawer: previewDrawerMocks.openTaskPreviewDrawer,
  };
});

vi.mock('../#TaskIterationManager', () => {
  return {
    default: () => null,
  };
});

vi.mock('../components/BoardToolbar', () => {
  return {
    default: () => null,
  };
});

/**
 * 构建独立 QueryClient，避免 React Query 缓存影响自动打开流程断言。
 *
 * @returns 测试专用 QueryClient
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

/**
 * 构建任务详情，测试只关心分享链接按 ID 打开抽屉。
 *
 * @param id 任务 ID
 * @returns 项目任务详情
 */
function buildTaskDetail(id: number): ProjectTaskDetail {
  return {
    id,
    projectId: 1,
    title: '分享任务',
    status: 'todo',
    priority: TaskPriority.Medium,
  };
}

/**
 * 渲染 v2 敏捷面板页面。
 */
function renderPage() {
  const queryClient = createTestQueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <Route.options.component />
    </QueryClientProvider>,
  );
}

describe('AgileBoardV2 shared preview', () => {
  afterEach(() => {
    vi.clearAllMocks();
    routeMocks.search = {};
  });

  it('query 初始化重渲染后仍应按 taskId 打开抽屉', async () => {
    const taskId = 1001;
    const drawerOpen = vi.fn().mockResolvedValue(undefined);

    routeMocks.search = { taskId };
    routeMocks.navigate.mockImplementation(async (options) => {
      routeMocks.search = options.search;
    });

    vi.mocked(useKDrawer).mockReturnValue({
      open: drawerOpen,
    });
    vi.mocked(useKModal).mockReturnValue({
      open: vi.fn(),
    });
    vi.mocked(ApiProject.getList).mockResolvedValue({
      items: [],
      total: 0,
      statusSummary: {
        all: 0,
        planning: 0,
        inProgress: 0,
        atRisk: 0,
        archived: 0,
      },
      groupOptions: [],
    });
    vi.mocked(ApiProjectTaskIteration.getList).mockResolvedValue([]);
    vi.mocked(ApiProjectTask.getAgileBoard).mockResolvedValue([]);
    vi.mocked(ApiProjectTaskStatus.getList).mockResolvedValue([]);
    vi.mocked(ApiProjectTaskType.getList).mockResolvedValue([]);
    vi.mocked(ApiProjectTask.getDetail)
      .mockReturnValueOnce(new Promise(() => {}))
      .mockResolvedValueOnce(buildTaskDetail(taskId));

    renderPage();

    await waitFor(() => {
      expect(ApiProjectTask.getDetail).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(drawerOpen).toHaveBeenCalledTimes(1);
    });
  });
});
