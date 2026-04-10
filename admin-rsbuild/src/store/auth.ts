import { ParsedLocation } from '@tanstack/react-router';
import { clearCurrentConfigCache } from '@/api/modules/file-access-config';
import { ApiPassport } from '@/api';
import { RequestError } from '@/api/types.ts';
import {
  CurrentInfoVo,
  PassportCurrentPermissionMenu,
} from '@/api/modules/passport.types.ts';
import { create } from 'zustand/react';

const LOGIN_PATH = '/login';
let authInitPromise: Promise<AuthInitResult> | null = null;

/**
 * 首屏鉴权初始化结果。
 */
export type AuthInitResult = 'authenticated' | 'anonymous';

/**
 * 判断异常是否表示未授权。
 *
 * @param err 异常对象
 * @returns 是否为 401
 */
const isUnauthorizedError = (err: unknown): boolean => {
  if (err instanceof RequestError && err.code === 401) {
    return true;
  }

  if (typeof err !== 'object' || err === null) {
    return false;
  }

  if (!('code' in err)) {
    return false;
  }

  return err.code === 401;
};

interface AuthStore {
  token: string;
  currentInfo?: CurrentInfoVo;
  menus: PassportCurrentPermissionMenu[];

  /**
   * 初始化状态，0=未初始化，1=初始化中，2=初始化完成
   */
  loadState: number;
  initState: (location: ParsedLocation) => Promise<AuthInitResult>;
  setToken: (token: string) => void;
  setCurrentInfo: (currentInfo?: CurrentInfoVo) => void;
  clearAuth: () => void;
}

const useAuthStore = create<AuthStore>((set, get) => {
  return {
    token: localStorage.getItem('token') || '',
    menus: [],

    loadState: 0,
    async initState(location) {
      if (location.pathname === LOGIN_PATH) {
        return 'anonymous';
      }

      if (authInitPromise) {
        return authInitPromise;
      }

      const state = get();
      if (state.loadState === 2 && state.currentInfo) {
        return 'authenticated';
      }

      const pageLoading = document.getElementById('page-loading');
      if (pageLoading && pageLoading.parentNode) {
        pageLoading.parentNode.removeChild(pageLoading);
      }

      authInitPromise = (async () => {
        set({ loadState: 1 });

        try {
          const token = get().token || localStorage.getItem('token') || '';
          if (!token) {
            get().clearAuth();
            return 'anonymous';
          }

          if (token !== get().token) {
            set({ token });
          }

          const [currentInfo, permission] = await Promise.all([
            ApiPassport.getCurrentUser(),
            ApiPassport.getCurrentPermission(),
          ]);

          set({
            currentInfo,
            menus: permission.menus,
            loadState: 2,
          });
          return 'authenticated';
        } catch (err) {
          if (isUnauthorizedError(err)) {
            /**
             * 首屏初始化阶段遇到 401 说明本地 token 已经失效。
             * 这里必须直接清空登录态并交给路由守卫重定向，
             * 不能弹确认框，否则路由 pending 可能一直不结束。
             */
            get().clearAuth();
            return 'anonymous';
          }

          set({ loadState: 0 });
          throw err;
        } finally {
          authInitPromise = null;
        }
      })();

      return authInitPromise;
    },
    setToken(token) {
      localStorage.setItem('token', token);
      clearCurrentConfigCache();
      set({ token });
    },
    setCurrentInfo(currentInfo) {
      set({ currentInfo });
    },
    clearAuth() {
      authInitPromise = null;
      localStorage.removeItem('token');
      clearCurrentConfigCache();
      set({
        token: '',
        currentInfo: undefined,
        menus: [],
        loadState: 0,
      });
    },
  };
});

export default useAuthStore;
