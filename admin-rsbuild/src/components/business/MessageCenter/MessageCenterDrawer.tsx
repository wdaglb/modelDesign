import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Empty, Segmented, Space, Spin, Typography, Button, message } from 'antd';
import { useContext, useState } from 'react';

import { ApiSystemMessage } from '@/api';
import { router } from '@/App.tsx';
import type { SystemMessageListItem } from '@/api/modules/system-message';
import { drawerContext } from '@/components/KDrawer/Drawer.tsx';
import queryKey from '@/constants/queryKey';

import {
  flattenMessagePages,
  MESSAGE_PAGE_SIZE,
  type MessageFilterKey,
  resolveNextPage,
  resolveReadStatus,
} from './helpers';
import MessageListItem from './MessageListItem';

/**
 * 消息中心抽屉。
 */
const MessageCenterDrawer = () => {
  const queryClient = useQueryClient();
  const drawer = useContext(drawerContext);
  const [filterKey, setFilterKey] = useState<MessageFilterKey>('all');
  const [readingMessageId, setReadingMessageId] = useState<number>();
  const [readAllLoading, setReadAllLoading] = useState(false);

  const readStatus = resolveReadStatus(filterKey);

  const unreadCountQuery = useQuery({
    queryKey: queryKey.systemMessage.unreadCount(),
    queryFn: () => ApiSystemMessage.getUnreadCount(),
  });

  const messageListQuery = useInfiniteQuery({
    queryKey: [...queryKey.systemMessage.list(), readStatus],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      return ApiSystemMessage.getList({
        current: pageParam,
        pageSize: MESSAGE_PAGE_SIZE,
        readStatus,
      });
    },
    getNextPageParam: (_lastPage, allPages) => {
      return resolveNextPage(allPages);
    },
  });

  const messages = flattenMessagePages(messageListQuery.data?.pages);
  const unreadCount = unreadCountQuery.data?.unreadCount || 0;

  const refreshMessageData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKey.systemMessage.unreadCount(),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKey.systemMessage.list(),
      }),
    ]);
  };

  const handleMessageClick = async (messageItem: SystemMessageListItem) => {
    if (readingMessageId !== undefined) {
      return;
    }

    setReadingMessageId(messageItem.id);

    try {
      if (!messageItem.isRead) {
        await ApiSystemMessage.read({
          id: messageItem.id,
        });
        await refreshMessageData();
      }

      if (!messageItem.redirectUrl) {
        return;
      }

      drawer.close();
      await navigateToMessage(messageItem.redirectUrl);
    } finally {
      setReadingMessageId(undefined);
    }
  };

  const handleReadAll = async () => {
    if (readAllLoading) {
      return;
    }

    setReadAllLoading(true);

    try {
      await ApiSystemMessage.readAll({
        readStatus,
      });
      await refreshMessageData();
      message.success('已标记为已读');
    } finally {
      setReadAllLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              消息通知
            </Typography.Title>
            <Typography.Text type={'secondary'}>
              当前未读 {unreadCount} 条
            </Typography.Text>
          </div>

          <Space size={8}>
            <Button
              type={'text'}
              size={'small'}
              disabled={unreadCount === 0}
              loading={readAllLoading}
              onClick={() => {
                void handleReadAll();
              }}
            >
              全部已读
            </Button>

            <Button
              type={'text'}
              size={'small'}
              onClick={() => {
                drawer.close();
              }}
            >
              关闭
            </Button>
          </Space>
        </div>

        <Segmented
          value={filterKey}
          options={[
            { label: '全部', value: 'all' },
            { label: '未读', value: 'unread' },
          ]}
          onChange={(nextValue) => {
            setFilterKey(nextValue as MessageFilterKey);
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '12px 16px',
        }}
      >
        <Spin spinning={messageListQuery.isFetching && messages.length === 0}>
          {messages.length === 0 && (
            <div
              style={{
                minHeight: 240,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Empty description={'暂无消息'} />
            </div>
          )}

          {messages.length > 0 && (
            <Space
              direction={'vertical'}
              size={10}
              style={{ width: '100%' }}
            >
              {messages.map((messageItem) => {
                return (
                  <MessageListItem
                    key={messageItem.id}
                    loading={readingMessageId === messageItem.id}
                    messageItem={messageItem}
                    onClick={handleMessageClick}
                  />
                );
              })}

              <div
                style={{
                  paddingTop: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {messageListQuery.hasNextPage && (
                  <Button
                    loading={messageListQuery.isFetchingNextPage}
                    onClick={() => {
                      void messageListQuery.fetchNextPage();
                    }}
                  >
                    加载更多
                  </Button>
                )}

                {!messageListQuery.hasNextPage && (
                  <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
                    消息已展示完毕
                  </Typography.Text>
                )}
              </div>
            </Space>
          )}
        </Spin>
      </div>

      <div
        style={{
          padding: '12px 20px 18px',
          borderTop: '1px solid rgba(15, 23, 42, 0.06)',
        }}
      >
        <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
          仅展示当前账号可见的最新系统消息。
        </Typography.Text>
      </div>
    </div>
  );
};

async function navigateToMessage(
  redirectUrl: string,
) {
  if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
    window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const normalizedRedirectUrl = normalizeMessageRedirectUrl(redirectUrl);

  await router.navigate({
    to: normalizedRedirectUrl as never,
  });
}

/**
 * 兼容历史消息里遗留的任务详情地址。
 *
 * 旧消息使用 `/project/task/detail?id=任务ID`，但当前前端没有独立任务详情页，
 * 任务详情实际承载在敏捷面板抽屉里，因此这里统一改写为可落到现有页面的地址。
 */
function normalizeMessageRedirectUrl(redirectUrl: string) {
  if (!redirectUrl.startsWith('/project/task/detail')) {
    return redirectUrl;
  }

  const legacyUrl = new URL(redirectUrl, window.location.origin);
  const taskId = legacyUrl.searchParams.get('id');
  if (!taskId) {
    return '/agile-board/';
  }

  return `/agile-board/?taskId=${encodeURIComponent(taskId)}`;
}

export default MessageCenterDrawer;
