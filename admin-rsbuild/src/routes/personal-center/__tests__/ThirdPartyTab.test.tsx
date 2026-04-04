import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiQywork } from '@/api';

import ThirdPartyTab from '../#ThirdPartyTab';

const navigateMock = vi.fn();

vi.mock('@/api', () => {
  return {
    ApiQywork: {
      getCurrentConfig: vi.fn(),
      getCurrentBinding: vi.fn(),
      createBindingSession: vi.fn(),
      getBindingSession: vi.fn(),
    },
  };
});

vi.mock('@iconify/react', () => {
  return {
    Icon: () => null,
  };
});

vi.mock('@tanstack/react-router', async () => {
  return {
    useNavigate: () => navigateMock,
  };
});

describe('ThirdPartyTab', () => {
  afterEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  it('租户已配置且用户未绑定时展示绑定企业微信按钮', async () => {
    vi.mocked(ApiQywork.getCurrentConfig).mockResolvedValue({
      tenantId: 1,
      corpId: 'ww123',
      corpSecret: 'secret',
      agentId: '100001',
      enabled: true,
      remark: '',
      createTime: '',
      updateTime: '',
    });
    vi.mocked(ApiQywork.getCurrentBinding).mockResolvedValue({
      provider: 'qywork',
      configReady: true,
      canStartBinding: true,
      isBound: false,
      providerUserId: '',
      boundAt: null,
      message: '当前租户已完成企业微信配置，可发起绑定',
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ThirdPartyTab />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('绑定企业微信')).toBeDefined();
  });
});
