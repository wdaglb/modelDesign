import { ParsedLocation, redirect } from '@tanstack/react-router';
import useAuthStore, { AuthInitResult } from '@/store/auth.ts';
import { canAccessPath, getFirstAccessiblePath } from '@/utils/permission.ts';

const LOGIN_PATH = '/login';

/**
 * 初始化登录态，并返回当前首屏鉴权结果。
 *
 * @param context 路由上下文
 */
const initialState = async (
  context: { location: ParsedLocation },
): Promise<AuthInitResult> => {
  const { location } = context;
  const authStore = useAuthStore.getState();
  return authStore.initState(location);
};

/**
 * 创建登录页重定向结果。
 *
 * @param location 当前目标路由
 * @returns TanStack Router 重定向对象
 */
export const buildLoginRedirect = (location: ParsedLocation) => {
  return redirect({
    to: LOGIN_PATH,
    search: {
      redirect: location.pathname,
    },
  });
};

/**
 * 执行首屏鉴权守卫。
 *
 * 约束：
 * 1. 访问登录页时直接跳过，避免再次触发初始化。
 * 2. 初始化返回匿名态时同步抛出重定向，保证根路由 pending 立即结束。
 *
 * @param location 当前目标路由
 */
export const runAuthGuard = async (location: ParsedLocation): Promise<void> => {
  if (location.pathname === LOGIN_PATH) {
    return;
  }

  const initResult = await initialState({ location });
  if (initResult === 'anonymous') {
    throw buildLoginRedirect(location);
  }

  const authState = useAuthStore.getState();
  if (!canAccessPath(authState.menus, location.pathname)) {
    throw redirect({
      to: getFirstAccessiblePath(authState.menus),
    });
  }
};

export default initialState;
