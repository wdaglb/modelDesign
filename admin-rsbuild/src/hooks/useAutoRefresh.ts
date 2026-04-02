import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  /**
   * 实际执行刷新的函数。
   *
   * 调用方可以传入同步函数，也可以传入返回 Promise 的异步函数。
   */
  refresh: () => void | Promise<unknown>;

  /**
   * 当前是否暂停自动刷新。
   */
  paused?: boolean;

  /**
   * 刷新间隔，单位毫秒。
   */
  intervalMs?: number;

  /**
   * 是否在暂停恢复后立即补刷一次。
   */
  refreshOnResume?: boolean;
}

/**
 * 统一封装页面级自动刷新调度。
 *
 * 该 Hook 只负责定时触发、暂停控制、恢复补刷和并发保护，
 * 不关心具体页面的请求细节，也不处理用户可见的错误提示。
 */
const useAutoRefresh = (options: UseAutoRefreshOptions) => {
  const {
    refresh,
    paused = false,
    intervalMs = 10000,
    refreshOnResume = true,
  } = options;
  const refreshRef = useRef(refresh);
  const pausedRef = useRef(paused);
  const timerRef = useRef<number>();
  const isRefreshingRef = useRef(false);
  const previousPausedRef = useRef(paused);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    /**
     * 统一处理单次刷新执行，避免轮询重叠。
     */
    const runRefresh = async () => {
      if (pausedRef.current) {
        return;
      }

      if (isRefreshingRef.current) {
        return;
      }

      isRefreshingRef.current = true;

      try {
        await refreshRef.current();
      } catch {
        /**
         * 自动刷新失败时保持静默，避免每轮轮询都打断用户。
         */
      } finally {
        isRefreshingRef.current = false;
      }
    };

    timerRef.current = window.setInterval(() => {
      void runRefresh();
    }, intervalMs);

    return () => {
      if (timerRef.current !== undefined) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [intervalMs]);

  useEffect(() => {
    if (!refreshOnResume) {
      previousPausedRef.current = paused;
      return;
    }

    if (previousPausedRef.current && !paused) {
      void (async () => {
        if (isRefreshingRef.current) {
          return;
        }

        isRefreshingRef.current = true;

        try {
          await refreshRef.current();
        } catch {
          /**
           * 恢复后的补刷同样保持静默失败策略。
           */
        } finally {
          isRefreshingRef.current = false;
        }
      })();
    }

    previousPausedRef.current = paused;
  }, [paused, refreshOnResume]);
};

export default useAutoRefresh;
