import axios from 'axios';
import qs from 'qs';
import useAuthStore from '@/store/auth.ts';
import { RequestError } from '@/api/types.ts';
import { get } from 'lodash-es';
import { message, Modal } from 'antd';
import { navigateLogin } from '@/service/loginService.ts';

interface RequestOptions {
  method?: 'get' | 'post';
  params?: any;
  data?: any;
}

const errorMessageMap: Record<number, string> = {
  400: '请求参数错误，请检查输入',
  401: '未授权，请重新登录',
  403: '禁止访问，权限不足',
  404: '请求的资源不存在',
  500: '服务器内部错误，请稍后重试',
};

let unauthorizedModalOpened = false;

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

const instance = axios.create({
  baseURL: '/api',
  paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
  },
});
instance.interceptors.request.use((config) => {
  const authStore = useAuthStore.getState();

  if (authStore.token) {
    config.headers['Authorization'] = authStore.token;
  }
  return config;
});
instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error?.response) {
      const requestError = new RequestError(error.response);
      const config = error.config;
      if (!get(config, 'skipErrorHandler', false)) {
        if (requestError.code === 401) {
          const { loadState } = useAuthStore.getState();

          if (loadState === 2) {
            openUnauthorizedModal();
          }
        } else if (requestError.code === 417) {
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
    ...options,
  });
};
