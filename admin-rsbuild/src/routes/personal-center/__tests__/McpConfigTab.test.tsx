import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiMcpConfig, ApiPassport } from '@/api';

import McpConfigTab from '../#McpConfigTab';

vi.mock('@/api', () => {
  return {
    ApiMcpConfig: {
      getCurrentConfig: vi.fn(),
    },
    ApiPassport: {
      getMcpToken: vi.fn(),
    },
  };
});

/**
 * 创建个人中心 MCP 配置页测试用 QueryClient。
 *
 * @returns 禁用重试的 QueryClient，避免接口 mock 失败时拖慢单测。
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

/**
 * 渲染 MCP 配置页签。
 *
 * @returns testing-library 渲染结果。
 */
function renderMcpConfigTab() {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <McpConfigTab />
    </QueryClientProvider>,
  );
}

describe('McpConfigTab', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('已启用配置时展示 MCP 基础字段', async () => {
    vi.mocked(ApiMcpConfig.getCurrentConfig).mockResolvedValue({
      enabled: true,
      serverName: 'task-mcp',
      transportType: 'streamable-http',
      endpoint: 'http://127.0.0.1:9999/ai/mcp',
      description: '供个人中心展示的 MCP 配置',
    });
    vi.mocked(ApiPassport.getMcpToken).mockResolvedValue({
      token: 'mcp-token-value',
      authorizationHeader: 'Bearer mcp-token-value',
      expireTime: 1776622714000,
    });

    renderMcpConfigTab();

    expect(await screen.findByText('MCP 基础配置')).toBeDefined();
    expect(await screen.findByText('task-mcp')).toBeDefined();
    expect(await screen.findByText('streamable-http')).toBeDefined();
    expect(await screen.findByText('http://127.0.0.1:9999/ai/mcp')).toBeDefined();
    expect(await screen.findByText('已启用')).toBeDefined();
    expect(await screen.findByText('示例 HTTP 配置片段')).toBeDefined();
    expect(await screen.findByText('测试指令示例')).toBeDefined();
    expect(await screen.findByText('查询任务类型')).toBeDefined();
    expect(await screen.findByText('按任务号开工')).toBeDefined();
    expect(await screen.findByText('完成任务闭环')).toBeDefined();
    expect(await screen.findByText('认证信息')).toBeDefined();
    expect(await screen.findByText('点击右侧图标复制 MCP token')).toBeDefined();
    expect(await screen.findByText('Bearer mcp-token-value')).toBeDefined();
    expect(await screen.findByText(/"headers": \{/)).toBeDefined();
    expect(await screen.findAllByText('Bearer mcp-token-value')).toBeTruthy();
  });

  it('可复制内容统一使用 Typography copyable 图标', async () => {
    vi.mocked(ApiMcpConfig.getCurrentConfig).mockResolvedValue({
      enabled: true,
      serverName: 'task-mcp',
      transportType: 'streamable-http',
      endpoint: 'http://127.0.0.1:9999/ai/mcp',
      description: '供个人中心展示的 MCP 配置',
    });
    vi.mocked(ApiPassport.getMcpToken).mockResolvedValue({
      token: 'mcp-token-value',
      authorizationHeader: 'Bearer mcp-token-value',
      expireTime: 1776622714000,
    });

    const { container } = renderMcpConfigTab();

    expect(await screen.findByText('示例 HTTP 配置片段')).toBeDefined();

    const copyButtons = container.querySelectorAll('.ant-typography-copy');

    expect(copyButtons.length).toBeGreaterThanOrEqual(7);
    expect(screen.queryByText('复制服务地址')).toBeNull();
    expect(screen.queryByText('复制配置片段')).toBeNull();
    expect(screen.queryByText('复制 MCP token')).toBeNull();
    expect(screen.queryByText('复制 Authorization 头')).toBeNull();
    expect(screen.queryByText('复制示例')).toBeNull();
  });

  it('未启用或缺少服务地址时不展示服务地址复制图标', async () => {
    vi.mocked(ApiMcpConfig.getCurrentConfig).mockResolvedValue({
      enabled: false,
      serverName: 'task-mcp',
      transportType: 'streamable-http',
      endpoint: '',
      description: '供个人中心展示的 MCP 配置',
    });
    vi.mocked(ApiPassport.getMcpToken).mockResolvedValue({
      token: 'mcp-token-value',
      authorizationHeader: 'Bearer mcp-token-value',
      expireTime: 1776622714000,
    });

    const { container } = renderMcpConfigTab();

    expect(await screen.findByText('未启用')).toBeDefined();

    const endpointItem = screen.getByText('服务地址').closest('tr');

    expect(endpointItem).toBeTruthy();

    if (!endpointItem) {
      return;
    }

    expect(endpointItem.querySelector('.ant-typography-copy')).toBeNull();
    expect(container.querySelectorAll('.ant-typography-copy').length)
      .toBeGreaterThan(0);
  });
});
