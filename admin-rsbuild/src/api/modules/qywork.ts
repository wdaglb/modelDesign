import request from '@/utils/request.ts';
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
   * 备注。
   */
  remark?: string;
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
