import type { ParsedLocation } from '@tanstack/react-router';

const DEFAULT_REDIRECT_PATH = '/';
const LOGIN_PATH = '/login';

/**
 * 判断候选跳转地址是否仍然指向登录页。
 *
 * @param redirect 候选跳转地址
 * @returns 是否会再次落回登录页
 */
const isLoginRedirect = (redirect: string): boolean => {
  if (redirect === LOGIN_PATH) {
    return true;
  }

  if (redirect === `${LOGIN_PATH}/`) {
    return true;
  }

  if (redirect.startsWith(`${LOGIN_PATH}?`)) {
    return true;
  }

  if (redirect.startsWith(`${LOGIN_PATH}#`)) {
    return true;
  }

  if (redirect.startsWith(`${LOGIN_PATH}/`)) {
    return true;
  }

  return false;
};

/**
 * 统一整理登录成功后的回跳地址。
 *
 * 这里只允许站内绝对路径，避免外链跳转与登录页自循环，
 * 这样登录成功后始终能落到一个稳定的业务入口。
 *
 * @param redirect 候选跳转地址
 * @returns 可安全使用的回跳地址
 */
export const normalizeLoginRedirect = (redirect?: string): string => {
  if (!redirect) {
    return DEFAULT_REDIRECT_PATH;
  }

  if (!redirect.startsWith('/')) {
    return DEFAULT_REDIRECT_PATH;
  }

  if (redirect.startsWith('//')) {
    return DEFAULT_REDIRECT_PATH;
  }

  if (isLoginRedirect(redirect)) {
    return DEFAULT_REDIRECT_PATH;
  }

  return redirect;
};

/**
 * 基于当前位置生成登录页的 redirect 参数。
 *
 * 这里会保留查询参数与 hash，避免用户在登录后丢失原始上下文。
 *
 * @param location 当前路由位置
 * @returns 用于登录回跳的站内路径
 */
export const buildLoginRedirectFromLocation = (
  location: Pick<ParsedLocation, 'pathname' | 'searchStr' | 'hash'>,
): string => {
  const searchStr = location.searchStr || '';
  const hash = location.hash || '';
  const redirect = `${location.pathname}${searchStr}${hash}`;

  return normalizeLoginRedirect(redirect);
};
