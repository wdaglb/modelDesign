import { md5 } from 'js-md5';

import request from '@/utils/request';
import { List } from '@/components/KTable/types.ts';

/**
 * 用户信息。
 */
export interface User {
  /**
   * 用户 ID。
   */
  id: number;

  /**
   * 用户昵称。
   */
  nickname: string;

  /**
   * 用户名。
   */
  username: string;

  /**
   * 默认租户 ID。
   */
  tenantId?: number;

  /**
   * 默认租户名称。
   */
  tenantName?: string;

  /**
   * 头像文件 ID。
   */
  avatarId: string;

  /**
   * 是否禁用。
   *
   * `true` 表示禁用，`false` 或 `undefined` 表示启用。
   */
  isDisable?: boolean;
}

/**
 * 用户分页查询参数。
 */
export interface UserPageParams {
  /**
   * 当前页码。
   */
  current?: number;

  /**
   * 每页条数。
   */
  pageSize?: number;

  /**
   * 统一关键字搜索，支持用户名、昵称和纯数字用户 ID。
   */
  keyword?: string;

  /**
   * 按用户 ID 集合筛选。
   */
  ids?: number[];

  /**
   * 按昵称关键字筛选。
   */
  nickname?: string;

  /**
   * 按租户 ID 筛选。
   */
  tenantId?: number;
}

/**
 * 新增用户请求参数。
 */
export interface UserCreateParams {
  /**
   * 用户昵称。
   */
  nickname: string;

  /**
   * 用户名。
   */
  username: string;

  /**
   * 用户密码。
   *
   * 前端发送前会先做一次 md5，后端再进行 BCrypt 编码入库。
   */
  password: string;

  /**
   * 默认租户 ID。
   */
  tenantId?: number;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 编辑用户请求参数。
 */
export interface UserUpdateParams {
  /**
   * 用户昵称。
   */
  nickname: string;

  /**
   * 用户名。
   */
  username: string;

  /**
   * 用户密码。
   *
   * 编辑场景下允许为空；为空时表示不修改原密码。
   */
  password?: string;

  /**
   * 默认租户 ID。
   */
  tenantId?: number;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 单个用户状态修改参数。
 */
export interface UserUpdateStatusParams {
  /**
   * 用户 ID。
   */
  id: number;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 批量用户状态修改参数。
 */
export interface UserBatchUpdateStatusParams {
  /**
   * 用户 ID 列表。
   */
  ids: number[];

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 获取用户分页列表。
 *
 * 用于用户管理页面和用户选择类场景。
 */
export const getPageList = (params?: UserPageParams) => {
  return request<List<User>>('/user/list', {
    params,
  });
};

/**
 * 新增用户。
 *
 * 发送前会将明文密码做一次 md5，再交由后端继续编码。
 */
export const add = (data: UserCreateParams) => {
  return request<User>('/user/add', {
    method: 'post',
    data: {
      ...data,
      password: md5(data.password),
    },
  });
};

/**
 * 编辑用户。
 *
 * 如果密码为空，则不会向后端传递有效密码值，用于保留原密码。
 */
export const update = (id: number, data: UserUpdateParams) => {
  return request<User>('/user/update', {
    method: 'post',
    params: { id },
    data: {
      ...data,
      password: data.password ? md5(data.password) : undefined,
    },
  });
};

/**
 * 修改单个用户状态。
 *
 * 用于列表页中的单条启用/禁用操作。
 */
export const updateStatus = (data: UserUpdateStatusParams) => {
  return request('/user/update_status', {
    method: 'post',
    data,
  });
};

/**
 * 批量修改用户状态。
 *
 * 当前仅用于批量启用/禁用。
 */
export const batchUpdateStatus = (data: UserBatchUpdateStatusParams) => {
  return request('/user/batch_update_status', {
    method: 'post',
    data,
  });
};

/**
 * 获取用户已绑定的角色编码列表。
 */
export const getUserRoles = (userId: number) => {
  return request<string[]>('/user/roles', {
    params: { userId },
  });
};

/**
 * 更新用户绑定角色。
 *
 * 传空数组则清空所有绑定。
 */
export const updateUserRoles = (userId: number, roleCodes: string[]) => {
  return request('/user/roles/update', {
    method: 'post',
    params: { userId },
    data: { roleCodes },
  });
};

/**
 * 获取用户已绑定的职位 ID 列表。
 */
export const getUserPositions = (userId: number) => {
  return request<number[]>('/user/positions', {
    params: { userId },
  });
};

/**
 * 更新用户绑定职位。
 *
 * 传空数组则清空所有绑定。
 */
export const updateUserPositions = (userId: number, positionIds: number[]) => {
  return request('/user/positions/update', {
    method: 'post',
    params: { userId },
    data: { positionIds },
  });
};
