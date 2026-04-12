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
});
