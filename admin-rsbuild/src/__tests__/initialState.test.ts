import { isRedirect, ParsedLocation } from '@tanstack/react-router';
import { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiPassport } from '@/api';
import initialState, { runAuthGuard } from '@/initialState.ts';
import { RequestError } from '@/api/types.ts';
import useAuthStore from '@/store/auth.ts';

vi.mock('@/api', () => {
  return {
    ApiPassport: {
      getCurrentUser: vi.fn(),
      getCurrentPermission: vi.fn(),
    },
  };
});

/**
 * 构造测试用路由位置信息。
 *
 * @param pathname 当前路径
 * @returns 最小可用的 ParsedLocation
 */
const createLocation = (pathname: string): ParsedLocation => {
  return {
    pathname,
    href: `http://localhost${pathname}`,
    search: {},
    searchStr: '',
    hash: '',
    state: undefined,
    maskedLocation: undefined,
    unmaskOnReload: false,
  } as ParsedLocation;
};

/**
 * 构造请求异常，便于模拟首屏鉴权 401。
 *
 * @param code HTTP 状态码
 * @returns RequestError 实例
 */
const createRequestError = (code: number) => {
  return new RequestError({
    status: code,
    data: {
      message: `mock-${code}`,
    },
  } as AxiosResponse);
};

describe('initialState', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().clearAuth();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    useAuthStore.getState().clearAuth();
  });

  it('无 token 访问首页时立即重定向到登录页', async () => {
    const location = createLocation('/');

    try {
      await runAuthGuard(location);
      throw new Error('expected redirect');
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe('/login');
        expect(err.options.search).toEqual({ redirect: '/' });
      }
    }

    expect(ApiPassport.getCurrentUser).not.toHaveBeenCalled();
    expect(ApiPassport.getCurrentPermission).not.toHaveBeenCalled();
    expect(useAuthStore.getState().loadState).toBe(0);
  });

  it('失效 token 在首屏初始化时清空登录态并重定向', async () => {
    const location = createLocation('/');
    useAuthStore.getState().setToken('expired-token');

    vi.mocked(ApiPassport.getCurrentUser).mockRejectedValue(
      createRequestError(401),
    );
    vi.mocked(ApiPassport.getCurrentPermission).mockResolvedValue({
      menus: [],
      permissions: [],
    });

    try {
      await runAuthGuard(location);
      throw new Error('expected redirect');
    } catch (err) {
      expect(isRedirect(err)).toBe(true);
      if (isRedirect(err)) {
        expect(err.options.to).toBe('/login');
        expect(err.options.search).toEqual({ redirect: '/' });
      }
    }

    expect(useAuthStore.getState().token).toBe('');
    expect(useAuthStore.getState().currentInfo).toBeUndefined();
    expect(useAuthStore.getState().loadState).toBe(0);
  });

  it('有效 token 的首屏初始化只请求一次当前用户与权限', async () => {
    const location = createLocation('/');
    useAuthStore.getState().setToken('valid-token');

    vi.mocked(ApiPassport.getCurrentUser).mockResolvedValue({
      id: 1,
      name: '测试用户',
    } as never);
    vi.mocked(ApiPassport.getCurrentPermission).mockResolvedValue({
      menus: [],
      permissions: [],
    });

    const firstResult = await initialState({ location });
    const secondResult = await initialState({ location });

    expect(firstResult).toBe('authenticated');
    expect(secondResult).toBe('authenticated');
    expect(ApiPassport.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(ApiPassport.getCurrentPermission).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().loadState).toBe(2);
  });

  it('直接访问登录页时跳过首屏初始化请求', async () => {
    const location = createLocation('/login');
    const result = await initialState({ location });

    expect(result).toBe('anonymous');
    expect(ApiPassport.getCurrentUser).not.toHaveBeenCalled();
    expect(ApiPassport.getCurrentPermission).not.toHaveBeenCalled();
  });
});
