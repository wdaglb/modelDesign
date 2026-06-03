import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiGitlab } from '@/api';
import useAuthStore from '@/store/auth.ts';

import { Route } from '../index';

vi.mock('@/api', () => {
  return {
    ApiGitlab: {
      getCurrentConfig: vi.fn(),
      saveCurrentConfig: vi.fn(),
      testConnection: vi.fn(),
    },
  };
});

/**
 * 使用独立 QueryClient 渲染 GitLab 配置页面。
 *
 * @returns userEvent 实例
 */
const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  useAuthStore.setState({
    currentInfo: {
      id: 1,
      username: 'admin',
      nickname: '管理员',
      tenantId: 1,
    } as any,
    permissions: [
      '/system/third-party/gitlab/save',
      '/system/third-party/gitlab/test-connection',
    ],
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Route.options.component />
    </QueryClientProvider>,
  );

  return userEvent.setup();
};

describe('GitlabConfigPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      currentInfo: null,
      permissions: [],
    });
  });

  it('加载配置时不回显完整 Token 和配置状态摘要', async () => {
    vi.mocked(ApiGitlab.getCurrentConfig).mockResolvedValue({
      tenantId: 1,
      serverUrl: 'https://gitlab.example.com',
      tokenConfigured: true,
      tokenMasked: '********',
      enabled: true,
      remark: '',
      createTime: '',
      updateTime: '',
    });
    renderPage();

    expect(await screen.findByDisplayValue('https://gitlab.example.com')).toBeDefined();
    expect(screen.queryByText('********')).toBeNull();
    expect(screen.queryByDisplayValue('secret-token')).toBeNull();
    expect(screen.queryByText('当前租户 ID')).toBeNull();
    expect(screen.queryByText('配置状态')).toBeNull();
    expect(screen.queryByText('Token 状态')).toBeNull();
  });

  it('已有配置保存时 Token 留空不会提交 accessToken 字段', async () => {
    const user = renderPage();
    vi.mocked(ApiGitlab.getCurrentConfig).mockResolvedValue({
      tenantId: 1,
      serverUrl: 'https://gitlab.example.com',
      tokenConfigured: true,
      tokenMasked: '********',
      enabled: true,
      remark: '',
      createTime: '',
      updateTime: '',
    });
    vi.mocked(ApiGitlab.saveCurrentConfig).mockResolvedValue({
      tenantId: 1,
      serverUrl: 'https://gitlab.example.com',
      tokenConfigured: true,
      tokenMasked: '********',
      enabled: true,
      remark: '',
      createTime: '',
      updateTime: '',
    });

    await screen.findByDisplayValue('https://gitlab.example.com');
    await user.click(screen.getByRole('button', { name: '保存配置' }));

    await waitFor(() => {
      expect(ApiGitlab.saveCurrentConfig).toHaveBeenCalledWith({
        serverUrl: 'https://gitlab.example.com',
        enabled: true,
      });
    });
  });

  it('测试连接使用当前租户配置接口且不展示项目列表', async () => {
    const user = renderPage();
    vi.mocked(ApiGitlab.getCurrentConfig).mockResolvedValue({
      tenantId: 1,
      serverUrl: 'https://gitlab.example.com',
      tokenConfigured: true,
      tokenMasked: '********',
      enabled: true,
      remark: '',
      createTime: '',
      updateTime: '',
    });
    vi.mocked(ApiGitlab.testConnection).mockResolvedValue({
      success: true,
      username: 'alice',
      name: 'Alice',
      webUrl: 'https://gitlab.example.com/alice',
      message: 'GitLab 连接成功',
    });

    expect(await screen.findByDisplayValue('https://gitlab.example.com')).toBeDefined();
    expect(screen.queryByText('GitLab 项目列表')).toBeNull();
    await user.click(screen.getByRole('button', { name: '测试连接' }));

    await waitFor(() => {
      expect(ApiGitlab.testConnection).toHaveBeenCalled();
    });
  });
});
