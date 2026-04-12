import type { List } from '@/components/KTable/types.ts';
import request from '@/utils/request';

/**
 * 消息读取状态。
 */
export type SystemMessageReadStatus = 'read' | 'unread';

/**
 * 系统消息列表项。
 */
export interface SystemMessageListItem {
  /**
   * 消息 ID。
   */
  id: number;

  /**
   * 消息作用域。
   */
  scopeType: string;

  /**
   * 租户 ID。
   */
  tenantId?: number;

  /**
   * 接收用户 ID。
   */
  receiverUserId?: number;

  /**
   * 消息分类。
   */
  category: string;

  /**
   * 消息标题。
   */
  title: string;

  /**
   * 消息内容。
   */
  content: string;

  /**
   * 跳转地址。
   */
  redirectUrl?: string;

  /**
   * 是否已读。
   */
  isRead: boolean;

  /**
   * 已读时间。
   */
  readAt?: string;

  /**
   * 创建时间。
   */
  createdAt: string;
}

/**
 * 系统消息列表请求参数。
 */
export interface SystemMessageListParams {
  /**
   * 当前页码。
   */
  current?: number;

  /**
   * 每页条数。
   */
  pageSize?: number;

  /**
   * 关键字。
   */
  keyword?: string;

  /**
   * 读取状态。
   */
  readStatus?: SystemMessageReadStatus;
}

/**
 * 系统消息未读数响应。
 */
export interface SystemMessageUnreadCount {
  /**
   * 未读数量。
   */
  unreadCount: number;
}

/**
 * 单条消息已读请求。
 */
export interface SystemMessageReadParams {
  /**
   * 消息 ID。
   */
  id: number;
}

/**
 * 全部已读请求。
 */
export interface SystemMessageReadAllParams {
  /**
   * 关键字。
   */
  keyword?: string;

  /**
   * 读取状态。
   */
  readStatus?: SystemMessageReadStatus;
}

/**
 * 获取系统消息列表。
 */
export const getList = (params?: SystemMessageListParams) => {
  return request<List<SystemMessageListItem>>('/system/message/list', {
    method: 'get',
    params,
  });
};

/**
 * 获取未读消息数量。
 */
export const getUnreadCount = () => {
  return request<SystemMessageUnreadCount>('/system/message/unread-count', {
    method: 'get',
  });
};

/**
 * 标记单条消息已读。
 */
export const read = (data: SystemMessageReadParams) => {
  return request<number>('/system/message/read', {
    method: 'post',
    data,
  });
};

/**
 * 按当前筛选条件全部标记已读。
 */
export const readAll = (data: SystemMessageReadAllParams) => {
  return request<number>('/system/message/read-all', {
    method: 'post',
    data,
  });
};
