import { request } from '@/utils';
import { md5 } from 'js-md5';
import { CurrentInfoVo, PassportCurrentPermission } from './passport.types.ts';

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
  return request('/passport/password_login', {
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
 * 注销登录
 */
export const logout = () => {
  return request('/passport/logout', {
    method: 'post',
  });
};
