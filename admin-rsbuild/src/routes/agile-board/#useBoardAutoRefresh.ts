import { useMemo, useState } from 'react';

import useAutoRefresh from '@/hooks/useAutoRefresh';

interface UseBoardAutoRefreshOptions {
  activeTaskDragId?: string;
  previewTaskId?: number;
  refetchBoardTasks: () => Promise<unknown>;
}

/**
 * 管理敏捷面板的自动刷新暂停与恢复行为。
 */
const useBoardAutoRefresh = (options: UseBoardAutoRefreshOptions) => {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  /**
   * 看板在拖拽、编辑和预览期间暂停自动刷新，避免界面跳动。
   */
  const isBoardRefreshPaused = useMemo(() => {
    if (options.activeTaskDragId !== undefined) {
      return true;
    }

    if (options.previewTaskId !== undefined) {
      return true;
    }

    return isTaskFormOpen;
  }, [isTaskFormOpen, options.activeTaskDragId, options.previewTaskId]);

  useAutoRefresh({
    paused: isBoardRefreshPaused,
    intervalMs: 10000,
    refresh: async () => {
      await options.refetchBoardTasks();
    },
  });

  return {
    setIsTaskFormOpen,
  };
};

export default useBoardAutoRefresh;
