import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiQywork } from '@/api';
import { RequestError } from '@/api/types';

import ThirdPartyTab from '../#ThirdPartyTab';

const { modalOpenMock, navigateMock } = vi.hoisted(() => {
  return {
    modalOpenMock: vi.fn(),
    navigateMock: vi.fn(),
  };
});

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

vi.mock('@/components/KModal', () => {
  return {
    useKModal: () => ({
      open: modalOpenMock,
    }),
  };
});

/**
 * 构造请求异常，便于测试二维码轮询遇到登录态失效后的终止逻辑。
 *
 * @param status HTTP 状态码
 * @returns RequestError 实例
 */
const createRequestError = (status: number) => {
  return new RequestError({
    status,
    data: {
      message: '未授权',
    },
  } as AxiosResponse);
};

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

  it('点击绑定企业微信后创建桌面端绑定会话并打开弹窗', async () => {
    const user = userEvent.setup();
    modalOpenMock.mockResolvedValue(undefined);
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
    vi.mocked(ApiQywork.createBindingSession).mockResolvedValue({
      sessionId: 'session-1',
      authUrl: 'https://example.test/qywork/auth',
      qrCodeUrl: 'https://example.test/qywork/qr',
      entryMode: 'desktop_qr',
      expireAt: '2026-05-21 10:00:00',
      pollIntervalMs: 2000,
    });
    vi.mocked(ApiQywork.getBindingSession).mockResolvedValue({
      sessionId: 'session-1',
      status: 'pending',
      expireAt: '2026-05-21 10:00:00',
    });

    /**
     * 用普通 Chrome UA 固定走桌面二维码分支，避免不同测试运行环境
     * 的 navigator.userAgent 差异让弹窗路径变成企微内跳转路径。
     */
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 Chrome/130',
    );

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

    await screen.findByText('绑定企业微信');
    const bindButtons = screen.getAllByRole('button');
    const bindButton = bindButtons.find((button) => {
      return button.textContent?.includes('绑定企业微信');
    });

    expect(bindButton).toBeDefined();
    await user.click(bindButton as HTMLElement);

    expect(ApiQywork.createBindingSession).toHaveBeenCalledWith(
      {
        entryMode: 'desktop_qr',
      },
      expect.anything(),
    );
    expect(modalOpenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '绑定企业微信',
        width: 680,
      }),
    );
    const modalProps = modalOpenMock.mock.calls[0]?.[0];

    /**
     * 当前测试里 KModal 被 mock 掉，不会自动把弹窗 children 挂到 DOM。
     * 这里单独渲染弹窗内容，验证二维码图片真正加载前会出现 loading 提示。
     */
    render(
      <QueryClientProvider client={queryClient}>
        {modalProps.children}
      </QueryClientProvider>,
    );

    expect(screen.getByText('二维码加载中...')).toBeDefined();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '刷新状态' })).toBeNull();
    });
  });

  it('二维码过期后才显示刷新状态按钮', async () => {
    vi.mocked(ApiQywork.getBindingSession).mockResolvedValue({
      sessionId: 'session-expired',
      status: 'expired',
      expireAt: '2026-05-21 10:00:00',
    });

    /**
     * 直接渲染弹窗内容可以把测试焦点收敛到状态按钮显示规则，
     * 避免重复走第三方账号卡片创建会话的前置流程。
     */
    const { default: QyworkBindingPanel } =
      await import('../#QyworkBindingPanel');
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <QyworkBindingPanel
          session={{
            sessionId: 'session-expired',
            authUrl: 'https://example.test/qywork/auth',
            qrCodeUrl: 'https://example.test/qywork/qr-expired',
            entryMode: 'desktop_qr',
            expireAt: '2026-05-21 10:00:00',
            pollIntervalMs: 2000,
          }}
          onRefreshBinding={vi.fn()}
        />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole('button', { name: '刷新状态' }),
    ).toBeDefined();
  });

  it('二维码轮询遇到 401 后展示登录失效提示且不显示刷新按钮', async () => {
    vi.mocked(ApiQywork.getBindingSession).mockRejectedValue(
      createRequestError(401),
    );

    /**
     * 直接渲染二维码面板，聚焦验证轮询请求失败后的终态展示，
     * 避免第三方账号卡片前置接口影响断言。
     */
    const { default: QyworkBindingPanel } =
      await import('../#QyworkBindingPanel');
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <QyworkBindingPanel
          session={{
            sessionId: 'session-unauthorized',
            authUrl: 'https://example.test/qywork/auth',
            qrCodeUrl: 'https://example.test/qywork/qr-unauthorized',
            entryMode: 'desktop_qr',
            expireAt: '2026-05-21 10:00:00',
            pollIntervalMs: 2000,
          }}
          onRefreshBinding={vi.fn()}
        />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText('登录状态已失效，已停止二维码状态轮询。'),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: '刷新状态' })).toBeNull();
  });
});
