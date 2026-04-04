import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiPassport } from '@/api';

import SecurityTab from '../#SecurityTab';

vi.mock('@/api', () => {
  return {
    ApiPassport: {
      getLoginHistory: vi.fn(),
      changePassword: vi.fn(),
    },
  };
});

vi.mock('@/service/loginService.ts', () => {
  return {
    logout: vi.fn(),
  };
});

describe('SecurityTab', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('最近登录历史展示浏览器、操作系统与设备类型列', async () => {
    vi.mocked(ApiPassport.getLoginHistory).mockResolvedValue([
      {
        loginId: 'L20260404001',
        loginIp: '127.0.0.1',
        loginType: 'PASSWORD',
        loginTime: '2026-04-04 10:00:00',
        browserName: 'Chrome',
        browserVersion: '136.0.0',
        osName: 'Windows',
        osVersion: '11',
        deviceType: 'DESKTOP',
      },
    ]);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SecurityTab />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('浏览器')).toBeDefined();
    expect(await screen.findByText('操作系统')).toBeDefined();
    expect(await screen.findByText('设备类型')).toBeDefined();
    expect(await screen.findByText('Chrome 136.0.0')).toBeDefined();
    expect(await screen.findByText('Windows 11')).toBeDefined();
    expect(await screen.findByText('桌面端')).toBeDefined();
    expect(await screen.findByText('账号密码')).toBeDefined();
  });
});
