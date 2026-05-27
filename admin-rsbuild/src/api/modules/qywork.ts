import request from '@/utils/request';
import { RequestError } from '@/api/types.ts';

/**
 * 企业微信配置。
 */
export interface QyworkConfig {
  /**
   * 当前租户 ID。
   */
  tenantId: number;

  /**
   * 企业微信 corpId。
   */
  corpId: string;

  /**
   * 企业微信 corpSecret。
   */
  corpSecret: string;

  /**
   * 企业微信应用 agentId。
   */
  agentId: string;

  /**
   * 当前租户企业微信配置是否启用。
   */
  enabled: boolean;

  /**
   * 备注。
   */
  remark: string;

  /**
   * 创建时间。
   */
  createTime: string;

  /**
   * 更新时间。
   */
  updateTime: string;
}

/**
 * 保存企业微信配置参数。
 */
export interface QyworkConfigSaveParams {
  /**
   * 企业微信 corpId。
   */
  corpId: string;

  /**
   * 企业微信 corpSecret。
   */
  corpSecret: string;

  /**
   * 企业微信应用 agentId。
   */
  agentId: string;

  /**
   * 当前租户企业微信配置是否启用。
   */
  enabled: boolean;

  /**
   * 备注。
   */
  remark?: string;
}

/**
 * 当前用户企业微信绑定状态。
 */
export interface QyworkCurrentBinding {
  provider: string;
  configReady: boolean;
  canStartBinding: boolean;
  isBound: boolean;
  providerUserId: string;
  boundAt: string | null;
  message: string;
}

export interface CreateQyworkBindingSessionParams {
  entryMode: 'in_app' | 'desktop_qr';
}

export interface QyworkBindingSessionCreated {
  sessionId: string;
  entryMode: 'in_app' | 'desktop_qr';
  authUrl: string;
  qrCodeUrl: string;
  expireAt: string;
  pollIntervalMs: number;
}

export interface QyworkBindingSessionStatus {
  sessionId: string;
  status:
    | 'pending'
    | 'authorizing'
    | 'binding'
    | 'success'
    | 'failed'
    | 'expired'
    | 'cancelled';
  failCode?: string;
  failMessage?: string;
  providerUserId?: string;
  completedAt?: string;
  expireAt: string;
}

/**
 * 获取当前租户企业微信配置。
 *
 * 当前租户尚未配置时，后端会返回 `404`，这里统一转换为 `null`，
 * 交由页面按“未配置”空态处理。
 */
export const getCurrentConfig = async () => {
  try {
    return await request<QyworkConfig>('/third-party/qywork/config/current', {
      method: 'get',
      skipErrorHandler: true,
    });
  } catch (error) {
    if (error instanceof RequestError && error.code === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * 保存当前租户企业微信配置。
 */
export const saveCurrentConfig = (data: QyworkConfigSaveParams) => {
  return request<QyworkConfig>('/third-party/qywork/config/save', {
    method: 'post',
    data,
  });
};

/**
 * 获取当前登录用户的企业微信绑定状态。
 */
export const getCurrentBinding = () => {
  return request<QyworkCurrentBinding>('/third-party/qywork/binding/current', {
    method: 'get',
  });
};

/**
 * 创建一轮新的企业微信绑定会话。
 */
export const createBindingSession = (data: CreateQyworkBindingSessionParams) => {
  return request<QyworkBindingSessionCreated>(
    '/third-party/qywork/binding/session',
    {
      method: 'post',
      data,
    },
  );
};

/**
 * 查询企业微信绑定会话状态。
 */
export const getBindingSession = (sessionId: string) => {
  return request<QyworkBindingSessionStatus>(
    `/third-party/qywork/binding/session/${sessionId}`,
    {
      method: 'get',
    },
  );
};
