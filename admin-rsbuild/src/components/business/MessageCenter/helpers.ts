import type {
  SystemMessageListItem,
  SystemMessageReadStatus,
} from '@/api/modules/system-message';

/**
 * 消息筛选键。
 */
export type MessageFilterKey = 'all' | 'unread';

/**
 * 单次加载条数。
 */
export const MESSAGE_PAGE_SIZE = 20;

/**
 * 格式化未读数量展示。
 */
export function formatUnreadCount(unreadCount?: number) {
  if (!unreadCount) {
    return '';
  }

  if (unreadCount > 99) {
    return '99+';
  }

  return String(unreadCount);
}

/**
 * 解析读取状态筛选参数。
 */
export function resolveReadStatus(filterKey: MessageFilterKey) {
  if (filterKey === 'unread') {
    return 'unread' as SystemMessageReadStatus;
  }

  return undefined;
}

/**
 * 提取消息列表。
 */
export function flattenMessagePages(
  pages?: Array<{ items: SystemMessageListItem[] }>,
) {
  if (!pages || pages.length === 0) {
    return [];
  }

  return pages.flatMap((page) => page.items);
}

/**
 * 判断是否存在更多消息。
 */
export function resolveNextPage(
  pages: Array<{ items: SystemMessageListItem[]; total: number }>,
) {
  const lastPage = pages[pages.length - 1];
  if (!lastPage) {
    return undefined;
  }

  const loadedCount = pages.reduce((count, page) => {
    return count + page.items.length;
  }, 0);

  if (loadedCount >= lastPage.total) {
    return undefined;
  }

  return pages.length + 1;
}
