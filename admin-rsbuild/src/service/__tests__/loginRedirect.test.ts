import { isRedirect, redirect } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import {
  buildLoginRedirectFromLocation,
  buildParsedLocationFromRedirect,
  normalizeLoginRedirect,
  resolveLoginRouteRedirect,
} from '@/service/loginRedirect.ts';

describe('loginRedirect', () => {
  it('保留站内业务地址的查询参数与 hash', () => {
    const redirect = buildLoginRedirectFromLocation({
      pathname: '/agile-board',
      searchStr: '?taskId=12',
      hash: '#detail',
    });

    expect(redirect).toBe('/agile-board?taskId=12#detail');
  });

  it('回跳地址为登录页时回落到首页', () => {
    expect(normalizeLoginRedirect('/login')).toBe('/');
    expect(normalizeLoginRedirect('/login?redirect=%2Fagile-board')).toBe('/');
  });

  it('拦截非法外链并回落到首页', () => {
    expect(normalizeLoginRedirect('https://example.com')).toBe('/');
    expect(normalizeLoginRedirect('//example.com')).toBe('/');
  });

  it('已有登录态且守卫放行时返回目标业务地址', async () => {
    const result = await resolveLoginRouteRedirect(
      '/system/role?tab=menu#permission',
      async () => {},
    );

    expect(result).toBe('/system/role?tab=menu#permission');
  });

  it('将回跳地址转换为初始化位置时保留 pathname、query 与 hash', () => {
    const location = buildParsedLocationFromRedirect(
      '/system/role?tab=menu#permission',
    );

    expect(location.pathname).toBe('/system/role');
    expect(location.searchStr).toBe('?tab=menu');
    expect(location.hash).toBe('#permission');
    expect(location.href).toBe('http://localhost/system/role?tab=menu#permission');
  });

  it('守卫判断需要回到登录页时停留在当前登录页', async () => {
    const result = await resolveLoginRouteRedirect(
      '/system/role',
      async () => {
        throw redirect({
          to: '/login',
          search: {
            redirect: '/system/role',
          },
        });
      },
    );

    expect(result).toBeNull();
  });

  it('守卫给出其他业务重定向时继续向上抛出', async () => {
    await expect(
      resolveLoginRouteRedirect('/system/role', async () => {
        throw redirect({
          to: '/personal-center',
        });
      }),
    ).rejects.toSatisfy((error: unknown) => {
      if (!isRedirect(error)) {
        return false;
      }

      return error.options.to === '/personal-center';
    });
  });
});
