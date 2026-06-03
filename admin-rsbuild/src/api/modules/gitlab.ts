import request from '@/utils/request';
import { RequestError } from '@/api/types.ts';

/**
 * GitLab 配置。
 */
export interface GitlabConfig {
  /**
   * 当前租户 ID。
   */
  tenantId: number;

  /**
   * GitLab 服务器地址。
   */
  serverUrl: string;

  /**
   * 是否已配置 Token。
   */
  tokenConfigured: boolean;

  /**
   * Token 脱敏显示值。
   */
  tokenMasked: string;

  /**
   * 当前租户 GitLab 配置是否启用。
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
 * 保存 GitLab 配置参数。
 */
export interface GitlabConfigSaveParams {
  /**
   * GitLab 服务器地址。
   */
  serverUrl: string;

  /**
   * GitLab 访问 Token。
   */
  accessToken?: string;

  /**
   * 当前租户 GitLab 配置是否启用。
   */
  enabled: boolean;

  /**
   * 备注。
   */
  remark?: string;
}

/**
 * GitLab 连接测试结果。
 */
export interface GitlabConnectionTestResult {
  success: boolean;
  username: string;
  name: string;
  webUrl: string;
  message: string;
}

/**
 * GitLab 项目。
 */
export interface GitlabProject {
  id: number;
  name: string;
  pathWithNamespace: string;
  webUrl: string;
  visibility: string;
  defaultBranch: string;
  lastActivityAt: string;
}

/**
 * GitLab 项目查询参数。
 */
export interface GitlabProjectListParams {
  current: number;
  pageSize: number;
  keyword?: string;
}

/**
 * 分页响应。
 */
export interface PageResponse<T> {
  items: T[];
  total: number;
}

/**
 * 获取当前租户 GitLab 配置。
 *
 * 当前租户尚未配置时，后端会返回 `404`，这里统一转换为 `null`，
 * 交由页面按“未配置”空态处理。
 */
export const getCurrentConfig = async () => {
  try {
    return await request<GitlabConfig>('/third-party/gitlab/config/current', {
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
 * 保存当前租户 GitLab 配置。
 */
export const saveCurrentConfig = (data: GitlabConfigSaveParams) => {
  return request<GitlabConfig>('/third-party/gitlab/config/save', {
    method: 'post',
    data,
  });
};

/**
 * 测试当前租户 GitLab 连接。
 */
export const testConnection = () => {
  return request<GitlabConnectionTestResult>(
    '/third-party/gitlab/config/test-connection',
    {
      method: 'post',
    },
  );
};

/**
 * 查询当前租户 GitLab 项目列表。
 */
export const getProjects = (
  params: GitlabProjectListParams,
  options?: { skipErrorHandler?: boolean },
) => {
  return request<PageResponse<GitlabProject>>(
    '/third-party/gitlab/config/projects',
    {
      method: 'get',
      params,
      skipErrorHandler: options?.skipErrorHandler,
    },
  );
};
