import { isRedirect, type ParsedLocation } from '@tanstack/react-router';

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
 * 将回跳地址转换为最小可用的路由位置信息。
 *
 * 登录页需要在真正跳转前先复用根路由守卫做一次校验，
 * 这里统一构造 `ParsedLocation`，避免各处重复拼接。
 *
 * @param redirect 已标准化的站内回跳地址
 * @returns 可供守卫复用的最小位置信息
 */
export const buildParsedLocationFromRedirect = (
  redirect: string,
): ParsedLocation => {
  const url = new URL(redirect, 'http://localhost');

  return {
    pathname: url.pathname,
    href: url.toString(),
    search: {},
    searchStr: url.search,
    hash: url.hash,
    state: undefined,
    maskedLocation: undefined,
    unmaskOnReload: false,
  } as ParsedLocation;
};

/**
 * 解析登录页在已有 token 场景下是否应该自动跳转。
 *
 * 设计意图：
 * 仅凭本地 token 直接离开登录页会绕过真正的鉴权与菜单校验，
 * 当目标页无权限或 token 已失效时，容易和根路由守卫形成来回重定向。
 * 因此这里先复用守卫校验目标地址，只在确认可达时才允许自动跳转。
 *
 * @param redirect 候选回跳地址
 * @param guard 路由守卫实现
 * @returns 可直接跳转的目标地址；若应停留登录页则返回 null
 */
export const resolveLoginRouteRedirect = async (
  redirect: string | undefined,
  guard: (location: ParsedLocation) => Promise<void>,
): Promise<string | null> => {
  const redirectTarget = normalizeLoginRedirect(redirect);
  const location = buildParsedLocationFromRedirect(redirectTarget);

  try {
    await guard(location);
    return redirectTarget;
  } catch (error) {
    if (isRedirect(error) && error.options.to === LOGIN_PATH) {
      return null;
    }
    throw error;
  }
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
