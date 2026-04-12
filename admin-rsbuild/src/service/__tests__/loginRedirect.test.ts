import { describe, expect, it } from 'vitest';

import {
  buildLoginRedirectFromLocation,
  normalizeLoginRedirect,
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
});
