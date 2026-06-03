import axios, { AxiosRequestConfig } from 'axios';
import qs from 'qs';
import { get } from 'lodash-es';
import { message, Modal } from 'antd';
import useAuthStore from '@/store/auth.ts';
import { RequestError } from '@/api/types.ts';
import { navigateLogin } from '@/service/loginService.ts';
import type { PassportLoginVo } from '@/api/modules/passport.types.ts';

interface RequestOptions {
  method?: 'get' | 'post';
  params?: any;
  data?: any;
  skipErrorHandler?: boolean;
  skipAuthRefresh?: boolean;
  skipAuthToken?: boolean;
}

interface AuthRequestConfig extends AxiosRequestConfig {
  skipErrorHandler?: boolean;
  skipAuthRefresh?: boolean;
  skipAuthToken?: boolean;
  _retry?: boolean;
}

const errorMessageMap: Record<number, string> = {
  400: '请求参数错误，请检查输入',
  401: '未授权，请重新登录',
  403: '禁止访问，权限不足',
  404: '请求的资源不存在',
  500: '服务器内部错误，请稍后重试',
};

let unauthorizedModalOpened = false;
let refreshTokenPromise: Promise<string | null> | null = null;

/**
 * 复用 axios 客户端基础配置，避免主请求与刷新请求在参数序列化上出现差异。
 *
 * @returns axios 实例
 */
const createHttpClient = () => {
  return axios.create({
    baseURL: '/api',
    headers: {
      /**
       * 后端仍使用 LocalDateTime 存储用户可见时间，必须按浏览器时区生成
       * “当前时间”，否则服务器部署时区不同会导致创建时间、更新时间偏移。
       */
      'X-Client-Time-Zone':
        Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    },
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: 'repeat' });
    },
  });
};

const instance = createHttpClient();
const refreshClient = createHttpClient();

/**
 * 打开登录失效提示。
 */
const openUnauthorizedModal = () => {
  if (unauthorizedModalOpened) {
    return;
  }
  unauthorizedModalOpened = true;
  Modal.confirm({
    title: '提示',
    content: '登录已过期，请重新登录',
    cancelButtonProps: { style: { display: 'none' } },
    onOk: async () => {
      unauthorizedModalOpened = false;
      await navigateLogin();
    },
    afterClose: () => {
      unauthorizedModalOpened = false;
    },
  });
};

/**
 * 使用 refresh token 申请新的 access token。
 *
 * <p>这里单独使用 refreshClient，目的是避免刷新接口再次走主拦截器，
 * 从而造成 401 递归刷新。</p>
 *
 * @returns 新的 access token；若无法刷新则返回 null
 */
const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    const authStore = useAuthStore.getState();
    const currentRefreshToken =
      authStore.refreshToken || localStorage.getItem('refreshToken') || '';
    if (!currentRefreshToken) {
      authStore.clearAuth();
      return null;
    }

    try {
      const response = await refreshClient.request<PassportLoginVo>({
        url: '/passport/refresh_token',
        method: 'post',
        data: {
          refreshToken: currentRefreshToken,
        },
      });
      const nextTokens = response.data;
      authStore.setTokens(nextTokens.accessToken, nextTokens.refreshToken);
      return nextTokens.accessToken;
    } catch (error) {
      authStore.clearAuth();
      throw error;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
};

/**
 * 基于刷新后的 access token 重放原始请求。
 *
 * @param config 原始请求配置
 * @returns 重放后的响应；若无需重放则返回 null
 */
const retryWithFreshToken = async (
  config?: AuthRequestConfig,
): Promise<unknown | null> => {
  if (!config) {
    return null;
  }
  if (config.skipAuthRefresh || config._retry) {
    return null;
  }

  const nextToken = await refreshAccessToken();
  if (!nextToken) {
    return null;
  }

  config._retry = true;
  if (!config.headers) {
    config.headers = {};
  }
  config.headers['Authorization'] = nextToken;
  return instance.request(config);
};

instance.interceptors.request.use((config) => {
  const authConfig = config as AuthRequestConfig;
  if (authConfig.skipAuthToken) {
    return authConfig;
  }

  const authStore = useAuthStore.getState();
  if (authStore.token) {
    if (!authConfig.headers) {
      authConfig.headers = {};
    }
    authConfig.headers['Authorization'] = authStore.token;
  }
  return authConfig;
});

instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (error?.response) {
      const requestError = new RequestError(error.response);
      const config = error.config as AuthRequestConfig | undefined;

      if (requestError.code === 401) {
        try {
          const retryResponse = await retryWithFreshToken(config);
          if (retryResponse) {
            return retryResponse;
          }
        } catch {
          /**
           * 刷新失败后继续走统一的未登录提示，
           * 不在这里直接抛出原始刷新异常，避免页面出现两套错误处理。
           */
        }

        if (!get(config, 'skipErrorHandler', false)) {
          const { loadState } = useAuthStore.getState();
          if (loadState === 2) {
            openUnauthorizedModal();
          }
        }
        return Promise.reject(requestError);
      }

      if (!get(config, 'skipErrorHandler', false)) {
        if (requestError.code === 417) {
          Modal.confirm({
            title: '提示',
            content: requestError.message,
            cancelButtonProps: {
              style: { display: 'none' },
            },
          });
        } else if (errorMessageMap[requestError.code]) {
          message.error(
            requestError.message || errorMessageMap[requestError.code],
          );
        }
      }
      return Promise.reject(requestError);
    }
    return Promise.reject(error);
  },
);

export default <T = any>(uri: string, options?: RequestOptions): Promise<T> => {
  return instance.request({
    url: uri,
    ...(options || {}),
  } as AuthRequestConfig);
};
