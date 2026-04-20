import { ParsedLocation } from '@tanstack/react-router';
import { clearCurrentConfigCache } from '@/api/modules/file-access-config';
import { ApiPassport } from '@/api';
import { RequestError } from '@/api/types.ts';
import { clearBrowserNotificationPermissionPromptState } from '@/service/browserNotificationPermissionPrompt.ts';
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

/**
 * 比较两份当前登录用户信息在界面关键字段上是否等价。
 *
 * store 层只要识别出“对界面没有可见差异”的更新，就应该直接跳过，
 * 这样页面层无需重复维护同一份去重逻辑，也能避免 useEffect 回写 store
 * 时因为等价新对象而触发渲染循环。
 *
 * @param currentStoreInfo 当前 store 中的用户信息
 * @param nextStoreInfo 即将写入 store 的用户信息
 * @returns 是否为等价数据
 */
const isSameCurrentInfo = (
  currentStoreInfo?: CurrentInfoVo,
  nextStoreInfo?: CurrentInfoVo,
) => {
  if (!currentStoreInfo && !nextStoreInfo) {
    return true;
  }

  if (!currentStoreInfo || !nextStoreInfo) {
    return false;
  }

  return (
    currentStoreInfo.userId === nextStoreInfo.userId &&
    currentStoreInfo.username === nextStoreInfo.username &&
    currentStoreInfo.nickname === nextStoreInfo.nickname &&
    currentStoreInfo.avatarId === nextStoreInfo.avatarId &&
    currentStoreInfo.tenantId === nextStoreInfo.tenantId &&
    currentStoreInfo.loginId === nextStoreInfo.loginId &&
    currentStoreInfo.loginIp === nextStoreInfo.loginIp &&
    currentStoreInfo.tokenCreateTime === nextStoreInfo.tokenCreateTime
  );
};

interface AuthStore {
  token: string;
  refreshToken: string;
  currentInfo?: CurrentInfoVo;
  menus: PassportCurrentPermissionMenu[];
  permissions: string[];

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
    permissions: [],

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
          const nextPermissions = permission.permissions || [];

          set({
            currentInfo,
            menus: permission.menus,
            permissions: nextPermissions,
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
      const currentStoreInfo = get().currentInfo;
      if (isSameCurrentInfo(currentStoreInfo, currentInfo)) {
        return;
      }

      set({ currentInfo });
    },
    clearAuth() {
      authInitPromise = null;
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      clearBrowserNotificationPermissionPromptState();
      clearCurrentConfigCache();
      set({
        token: '',
        refreshToken: '',
        currentInfo: undefined,
        menus: [],
        permissions: [],
        loadState: 0,
      });
    },
  };
});

export default useAuthStore;
