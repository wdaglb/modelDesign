import { RequestError } from '@/api/types.ts';
import { redirect } from '@tanstack/react-router';

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
 * 初始化错误处理
 * @param err
 */
export const initErrorHandler = async (err: unknown) => {
  // if (isRedirect(err)) {
  //   throw err;
  // }
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
