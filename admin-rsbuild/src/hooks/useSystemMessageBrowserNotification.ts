import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiSystemMessage } from '@/api';
import queryKey from '@/constants/queryKey';
import {
  deliverSystemMessageBrowserNotification,
  isBrowserNotificationSupported,
  registerBrowserNotificationWorkerIfSupported,
  resolveUnnotifiedSystemMessages,
  showSystemMessageInAppToast,
  SYSTEM_MESSAGE_POLL_INTERVAL,
} from '@/service/browserNotificationService';

interface UseSystemMessageBrowserNotificationOptions {
  /**
   * 当前登录用户 ID。
   */
  userId?: number;
}

/**
 * 系统消息浏览器通知监听。
 *
 * 该 Hook 只负责把“新增未读消息”投递为系统通知：
 * - 首次拉取只建立基线，不把历史未读全部弹出；
 * - 后续轮询只通知新出现的未读消息；
 * - 用户切换时重置已通知记录，避免跨账号串消息。
 */
const useSystemMessageBrowserNotification = (
  options: UseSystemMessageBrowserNotificationOptions,
) => {
  const queryClient = useQueryClient();
  const initializedRef = useRef(false);
  const notifiedIdsRef = useRef<Set<number>>(new Set());
  const lastUserIdRef = useRef<number>();
  const lastUnreadCountRef = useRef<number>();

  const queryEnabled = options.userId !== undefined;

  const unreadCountQuery = useQuery({
    queryKey: [...queryKey.systemMessage.unreadCount(), 'browser-notification'],
    queryFn: () => {
      return ApiSystemMessage.getUnreadCount();
    },
    enabled: queryEnabled,
    staleTime: 0,
    refetchInterval: SYSTEM_MESSAGE_POLL_INTERVAL,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const unreadMessageQuery = useQuery({
    queryKey: [...queryKey.systemMessage.list(), 'browser-notification'],
    queryFn: () => {
      return ApiSystemMessage.getList({
        current: 1,
        pageSize: 50,
        readStatus: 'unread',
      });
    },
    enabled: queryEnabled,
    staleTime: 0,
    refetchInterval: SYSTEM_MESSAGE_POLL_INTERVAL,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!queryEnabled) {
      return;
    }

    void registerBrowserNotificationWorkerIfSupported();
  }, [queryEnabled]);

  useEffect(() => {
    if (lastUserIdRef.current === options.userId) {
      return;
    }

    lastUserIdRef.current = options.userId;
    initializedRef.current = false;
    notifiedIdsRef.current = new Set();
    lastUnreadCountRef.current = undefined;
  }, [options.userId]);

  useEffect(() => {
    const unreadCount = unreadCountQuery.data?.unreadCount;
    if (unreadCount === undefined) {
      return;
    }

    const previousUnreadCount = lastUnreadCountRef.current;
    lastUnreadCountRef.current = unreadCount;

    if (previousUnreadCount === undefined) {
      return;
    }

    if (unreadCount <= previousUnreadCount) {
      return;
    }

    /**
     * 当未读数明显上涨时，立即强制刷新未读消息列表，
     * 避免仅靠定时轮询时因为缓存窗口或响应先后顺序导致通知滞后。
     */
    void queryClient.invalidateQueries({
      queryKey: [...queryKey.systemMessage.list(), 'browser-notification'],
    });
  }, [queryClient, unreadCountQuery.data?.unreadCount]);

  useEffect(() => {
    const unreadMessages = unreadMessageQuery.data?.items;
    if (!unreadMessages) {
      return;
    }

    const browserNotificationSupported = isBrowserNotificationSupported();
    if (!browserNotificationSupported) {
      initializedRef.current = true;
      return;
    }

    const notifiedIds = notifiedIdsRef.current;

    if (!initializedRef.current) {
      unreadMessages.forEach((messageItem) => {
        notifiedIds.add(messageItem.id);
      });
      initializedRef.current = true;
      return;
    }

    const unnotifiedMessages = resolveUnnotifiedSystemMessages(
      unreadMessages,
      notifiedIds,
    );

    unreadMessages.forEach((messageItem) => {
      notifiedIds.add(messageItem.id);
    });

    unnotifiedMessages.forEach((messageItem) => {
      void deliverSystemMessageBrowserNotification(messageItem);
      showSystemMessageInAppToast(messageItem);
    });
  }, [unreadMessageQuery.data?.items]);
};

export default useSystemMessageBrowserNotification;
