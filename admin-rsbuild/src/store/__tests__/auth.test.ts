import { beforeEach, describe, expect, it } from 'vitest';
import useAuthStore from '@/store/auth.ts';

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().clearAuth();
  });

  it('setTokens 应同时持久化 access token 与 refresh token', () => {
    useAuthStore.getState().setTokens('access-token', 'refresh-token');

    expect(useAuthStore.getState().token).toBe('access-token');
    expect(useAuthStore.getState().refreshToken).toBe('refresh-token');
    expect(localStorage.getItem('token')).toBe('access-token');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
  });

  it('clearAuth 应同时清理 access token 与 refresh token', () => {
    useAuthStore.getState().setTokens('access-token', 'refresh-token');

    useAuthStore.getState().clearAuth();

    expect(useAuthStore.getState().token).toBe('');
    expect(useAuthStore.getState().refreshToken).toBe('');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('setCurrentInfo 遇到等价数据时应跳过重复写入', () => {
    const currentInfo = {
      userId: 1,
      username: 'zhangsan',
      nickname: '张三',
      avatarId: 'avatar-1',
      tenantId: 100,
      loginId: 'login-1',
      loginIp: '127.0.0.1',
      tokenCreateTime: '2026-04-21 09:00:00',
      extraField: 'first',
    };

    useAuthStore.getState().setCurrentInfo(currentInfo);

    const storedCurrentInfo = useAuthStore.getState().currentInfo;

    useAuthStore.getState().setCurrentInfo({
      ...currentInfo,
      extraField: 'second',
    });

    expect(useAuthStore.getState().currentInfo).toBe(storedCurrentInfo);
  });

  it('setCurrentInfo 遇到关键字段变化时应写入新值', () => {
    useAuthStore.getState().setCurrentInfo({
      userId: 1,
      username: 'zhangsan',
      nickname: '张三',
      avatarId: 'avatar-1',
      tenantId: 100,
      loginId: 'login-1',
      loginIp: '127.0.0.1',
      tokenCreateTime: '2026-04-21 09:00:00',
    });

    useAuthStore.getState().setCurrentInfo({
      userId: 1,
      username: 'zhangsan',
      nickname: '张三（新）',
      avatarId: 'avatar-1',
      tenantId: 100,
      loginId: 'login-1',
      loginIp: '127.0.0.1',
      tokenCreateTime: '2026-04-21 09:00:00',
    });

    expect(useAuthStore.getState().currentInfo?.nickname).toBe('张三（新）');
  });
});
