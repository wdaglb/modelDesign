import { AxiosResponse } from 'axios';

/**
 * 请求响应错误
 */
export class RequestError extends Error {
  code: number;

  constructor(public response: AxiosResponse) {
    super(response.data?.message || 'Request failed');
    this.code = response.status;
    this.name = 'RequestError';
  }
}
