import { ParsedLocation } from '@tanstack/react-router';
import { ApiPassport } from '@/api';
import {
  CurrentInfoVo,
  PassportCurrentPermissionMenu,
} from '@/api/modules/passport.types.ts';
import { create } from 'zustand/react';
import { redirectLogin } from '@/service/loginService.ts';

const LOGIN_PATH = '/login';

interface AuthStore {
  token: string;
  currentInfo?: CurrentInfoVo;
  menus: PassportCurrentPermissionMenu[];

  /**
   * 初始化状态，0=未初始化，1=初始化中，2=初始化完成
   */
  loadState: number;
  initState: (location: ParsedLocation) => Promise<void>;
  setToken: (token: string) => void;
  clearAuth: () => void;
}

const useAuthStore = create<AuthStore>((set, get) => {
  return {
    token: localStorage.getItem('token') || '',
    menus: [],

    loadState: 0,
    async initState(location) {
      const pageLoading = document.getElementById('page-loading');
      if (pageLoading && pageLoading.parentNode) {
        pageLoading.parentNode.removeChild(pageLoading);
      }

      if (location.pathname === LOGIN_PATH) {
        return;
      }
      set({ loadState: 1 });
      try {
        const state = get();
        if (!state.token) {
          redirectLogin();
          return;
        }
        const [currentInfo, permission] = await Promise.all([
          ApiPassport.getCurrentUser(),
          ApiPassport.getCurrentPermission(),
        ]);
        set({ currentInfo, menus: permission.menus });
        set({ loadState: 2 });
      } catch (err) {
        set({ loadState: 0 });
        throw err;
      }
    },
    setToken(token) {
      localStorage.setItem('token', token);
      set({ token });
    },
    clearAuth() {
      localStorage.removeItem('token');
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
