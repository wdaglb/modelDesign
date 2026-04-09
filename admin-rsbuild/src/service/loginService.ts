import { RequestError } from '@/api/types.ts';
import { isRedirect, redirect } from '@tanstack/react-router';

import { router } from '@/App.tsx';
import { ApiPassport } from '@/api';
import KModal from '@/components/KModal';
import useAuthStore from '@/store/auth.ts';

const getLoginRedirect = () => {
  return router.state.location.pathname;
};

/**
 * 跳转到登录页面
 */
export const redirectLogin = () => {
  throw redirect({
    to: '/login',
    search: {
      redirect: getLoginRedirect(),
    },
  });
};

/**
 * 运行时跳转到登录页面
 */
export const navigateLogin = async () => {
  useAuthStore.getState().clearAuth();
  await router.navigate({
    to: '/login',
    search: {
      redirect: getLoginRedirect(),
    },
    replace: true,
  });
};

/**
 * 主动注销登录
 */
export const logout = async (requestLogout = false) => {
  try {
    if (requestLogout) {
      await ApiPassport.logout();
    }
  } finally {
    await navigateLogin();
  }
};

/**
 * 运行期登录态异常处理。
 *
 * 说明：
 * 首屏初始化阶段的 401 已由根路由守卫直接重定向处理，
 * 这里仅保留运行期兜底，避免在路由 pending 中等待弹窗确认。
 *
 * @param err 异常对象
 */
export const initErrorHandler = async (err: unknown) => {
  if (isRedirect(err)) {
    throw err;
  }

  if (err instanceof RequestError) {
    if (err.code === 401) {
      await KModal.confirm({
        title: '提示',
        content: '登录已过期，请重新登录',
        cancelButtonProps: { style: { display: 'none' } },
      });
      await logout();
      return;
    }
  }
  throw err;
};
