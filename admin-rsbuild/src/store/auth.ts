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
const TOKEN_STORAGE_KEY = 'token';
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
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

/**
 * 读取本地存储中的 token，统一空值回落。
 *
 * @param key 存储键
 * @returns 非空字符串
 */
const readStorageToken = (key: string): string => {
  const value = localStorage.getItem(key);
  if (!value) {
    return '';
  }
  return value;
};

interface AuthStore {
  token: string;
  refreshToken: string;
  currentInfo?: CurrentInfoVo;
  menus: PassportCurrentPermissionMenu[];
  buttons: string[];

  /**
   * 初始化状态，0=未初始化，1=初始化中，2=初始化完成
   */
  loadState: number;
  initState: (location: ParsedLocation) => Promise<AuthInitResult>;
  setToken: (token: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setCurrentInfo: (currentInfo?: CurrentInfoVo) => void;
  clearAuth: () => void;
}

const useAuthStore = create<AuthStore>((set, get) => {
  return {
    token: readStorageToken(TOKEN_STORAGE_KEY),
    refreshToken: readStorageToken(REFRESH_TOKEN_STORAGE_KEY),
    menus: [],
    buttons: [],

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
          const token = get().token || readStorageToken(TOKEN_STORAGE_KEY);
          const refreshToken =
            get().refreshToken || readStorageToken(REFRESH_TOKEN_STORAGE_KEY);
          if (!token) {
            if (!refreshToken) {
              get().clearAuth();
            }
            return 'anonymous';
          }

          if (token !== get().token || refreshToken !== get().refreshToken) {
            set({ token, refreshToken });
          }

          const [currentInfo, permission] = await Promise.all([
            ApiPassport.getCurrentUser(),
            ApiPassport.getCurrentPermission(),
          ]);
          const nextButtons = permission.buttons || [];

          set({
            currentInfo,
            menus: permission.menus,
            buttons: nextButtons,
            loadState: 2,
          });
          return 'authenticated';
        } catch (err) {
          if (isUnauthorizedError(err)) {
            /**
             * 首屏初始化阶段遇到 401 说明本地 token 已经完全失效。
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
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      clearCurrentConfigCache();
      set({ token });
    },
    setTokens(token, refreshToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
      clearCurrentConfigCache();
      set({ token, refreshToken });
    },
    setCurrentInfo(currentInfo) {
      set({ currentInfo });
    },
    clearAuth() {
      authInitPromise = null;
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      clearCurrentConfigCache();
      set({
        token: '',
        refreshToken: '',
        currentInfo: undefined,
        menus: [],
        buttons: [],
        loadState: 0,
      });
    },
  };
});

export default useAuthStore;
