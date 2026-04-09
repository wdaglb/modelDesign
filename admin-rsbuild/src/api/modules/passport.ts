import { request } from '@/utils';
import { md5 } from 'js-md5';
import {
  CurrentInfoVo,
  LoginHistoryVo,
  PassportLoginVo,
  PassportCurrentPermission,
  RegisterParams,
  UpdateCurrentProfileParams,
} from './passport.types.ts';

export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  return request<CurrentInfoVo>('/passport/current_info', {
    method: 'get',
  });
};

/**
 * 更新当前登录用户基础资料。
 */
export const updateCurrentProfile = (data: UpdateCurrentProfileParams) => {
  return request<CurrentInfoVo>('/passport/update_current_profile', {
    method: 'post',
    data,
  });
};

/**
 * 获取当前权限
 */
export const getCurrentPermission = () => {
  return request<PassportCurrentPermission>('/passport/current_permission', {
    method: 'get',
  });
};

/**
 * 密码登录
 */
export const passwordLogin = (data: any) => {
  return request<PassportLoginVo>('/passport/password_login', {
    method: 'post',
    data: {
      ...data,
      password: md5(data.password),
    },
  });
};

/**
 * 匿名注册并自动登录。
 */
export const register = (data: RegisterParams) => {
  return request<PassportLoginVo>('/passport/register', {
    method: 'post',
    data: {
      ...data,
      password: md5(data.password),
    },
  });
};

/**
 * 修改密码
 */
export const changePassword = (data: ChangePasswordParams) => {
  return request('/passport/change_password', {
    method: 'post',
    data: {
      oldPassword: md5(data.oldPassword),
      newPassword: md5(data.newPassword),
    },
  });
};

/**
 * 获取当前登录用户最近登录历史。
 */
export const getLoginHistory = () => {
  return request<LoginHistoryVo[]>('/passport/login_history', {
    method: 'get',
  });
};

/**
 * 注销登录
 */
export const logout = () => {
  return request('/passport/logout', {
    method: 'post',
  });
};
