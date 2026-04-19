import request from '@/utils/request';

/**
 * MCP 配置。
 */
export interface McpConfig {
  /**
   * 是否启用。
   */
  enabled: boolean;

  /**
   * 服务名。
   */
  serverName: string;

  /**
   * 传输协议类型。
   */
  transportType: string;

  /**
   * 服务地址。
   */
  endpoint: string;

  /**
   * 配置说明。
   */
  description: string;
}

/**
 * 获取当前 MCP 配置。
 */
export const getCurrentConfig = () => {
  return request<McpConfig>('/ai/mcp/config/current', {
    method: 'get',
  });
};
