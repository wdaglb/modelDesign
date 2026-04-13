import { RequestError } from '@/api/types.ts';
import request from '@/utils/request';

/**
 * 文件访问配置。
 */
export interface FileAccessConfig {
  /**
   * 当前租户 ID。
   */
  tenantId: number;

  /**
   * 文件访问域名。
   */
  accessDomain: string;

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
 * 保存文件访问配置参数。
 */
export interface FileAccessConfigSaveParams {
  /**
   * 文件访问域名。
   */
  accessDomain: string;

  /**
   * 备注。
   */
  remark?: string;
}

let fileAccessConfigCache: FileAccessConfig | null | undefined;
let fileAccessConfigPromise: Promise<FileAccessConfig | null> | null = null;

/**
 * 清理文件访问配置缓存。
 *
 * 当用户切换登录态或显式刷新配置时，需要丢弃旧租户缓存。
 */
export const clearCurrentConfigCache = () => {
  fileAccessConfigCache = undefined;
  fileAccessConfigPromise = null;
};

/**
 * 获取当前租户文件访问配置。
 *
 * 当前租户尚未配置时，后端会返回 `404`，这里统一转换为 `null`，
 * 交由页面按“未配置”空态处理。
 */
export const getCurrentConfig = async () => {
  if (fileAccessConfigCache !== undefined) {
    return fileAccessConfigCache;
  }

  if (fileAccessConfigPromise) {
    return fileAccessConfigPromise;
  }

  fileAccessConfigPromise = request<FileAccessConfig>(
    '/system/file/access-config/current',
    {
      method: 'get',
      skipErrorHandler: true,
    },
  )
    .then((config) => {
      fileAccessConfigCache = config;
      fileAccessConfigPromise = null;
      return config;
    })
    .catch((error) => {
      fileAccessConfigPromise = null;
      if (error instanceof RequestError && error.code === 404) {
        fileAccessConfigCache = null;
        return null;
      }
      throw error;
    });

  return fileAccessConfigPromise;
};

/**
 * 保存当前租户文件访问配置。
 */
export const saveCurrentConfig = async (data: FileAccessConfigSaveParams) => {
  const savedConfig = await request<FileAccessConfig>(
    '/system/file/access-config/save',
    {
      method: 'post',
      data,
    },
  );

  fileAccessConfigCache = savedConfig;
  fileAccessConfigPromise = null;
  return savedConfig;
};

/**
 * 获取当前租户的文件访问域名。
 *
 * 读取失败时返回 `null`，避免文件上传和展示链路被配置读取异常阻断。
 */
export const getCurrentAccessDomain = async () => {
  try {
    const currentConfig = await getCurrentConfig();
    if (!currentConfig) {
      return null;
    }
    return normalizeAccessDomain(currentConfig.accessDomain);
  } catch {
    return null;
  }
};

function normalizeAccessDomain(accessDomain?: string) {
  if (!accessDomain) {
    return null;
  }

  let normalizedValue = accessDomain.trim();
  while (normalizedValue.endsWith('/')) {
    normalizedValue = normalizedValue.slice(0, normalizedValue.length - 1);
  }

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue;
}
