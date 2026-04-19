import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiMcpConfig, ApiPassport } from '@/api';
import { copyTextToClipboard } from '@/utils';

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

vi.mock('@/utils', () => {
  return {
    copyTextToClipboard: vi.fn(),
  };
});

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

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <McpConfigTab />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('MCP 基础配置')).toBeDefined();
    expect(await screen.findByText('task-mcp')).toBeDefined();
    expect(await screen.findByText('streamable-http')).toBeDefined();
    expect(await screen.findByText('http://127.0.0.1:9999/ai/mcp')).toBeDefined();
    expect(await screen.findByText('已启用')).toBeDefined();
    expect(await screen.findByText('示例 HTTP 配置片段')).toBeDefined();
    expect(await screen.findByText('复制服务地址')).toBeDefined();
    expect(await screen.findByText('复制配置片段')).toBeDefined();
    expect(await screen.findByText('测试指令示例')).toBeDefined();
    expect(await screen.findByText('查询任务类型')).toBeDefined();
    expect(await screen.findByText('按任务号开工')).toBeDefined();
    expect(await screen.findByText('完成任务闭环')).toBeDefined();
    expect(await screen.findByText('认证信息')).toBeDefined();
    expect(await screen.findByText('Bearer mcp-token-value')).toBeDefined();
    expect(await screen.findByText('复制 MCP token')).toBeDefined();
    expect(await screen.findByText('复制 Authorization 头')).toBeDefined();
    expect(await screen.findByText(/"headers": \{/)).toBeDefined();
    expect(await screen.findAllByText('Bearer mcp-token-value')).toBeTruthy();
  });

  it('点击复制服务地址时写入剪贴板并提示成功', async () => {
    const successMock = vi.spyOn(message, 'success').mockImplementation(() => {
      return undefined as never;
    });

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

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <McpConfigTab />
      </QueryClientProvider>,
    );

    const copyButton = await screen.findByText('复制服务地址');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(copyTextToClipboard).toHaveBeenCalledWith(
        'http://127.0.0.1:9999/ai/mcp',
      );
    });
    await waitFor(() => {
      expect(successMock).toHaveBeenCalledWith('MCP 服务地址已复制');
    });
  });

  it('点击复制示例时写入测试指令并提示成功', async () => {
    const successMock = vi.spyOn(message, 'success').mockImplementation(() => {
      return undefined as never;
    });

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

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <McpConfigTab />
      </QueryClientProvider>,
    );

    const copyButtons = await screen.findAllByText('复制示例');
    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(copyTextToClipboard).toHaveBeenCalledWith(
        '请优先使用 MCP 工具查询当前可用的任务类型列表，返回名称和 typeId，并告诉我如果要创建“缺陷”任务应该使用哪个 typeId。',
      );
    });
    await waitFor(() => {
      expect(successMock).toHaveBeenCalledWith('查询任务类型已复制');
    });
  });

  it('点击复制 Authorization 头时写入带 Bearer 的 token', async () => {
    const successMock = vi.spyOn(message, 'success').mockImplementation(() => {
      return undefined as never;
    });

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

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <McpConfigTab />
      </QueryClientProvider>,
    );

    const copyButton = await screen.findByText('复制 Authorization 头');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(copyTextToClipboard).toHaveBeenCalledWith(
        'Bearer mcp-token-value',
      );
    });
    await waitFor(() => {
      expect(successMock).toHaveBeenCalledWith('Authorization 头已复制');
    });
  });
});
