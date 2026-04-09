import {
  createRootRoute,
  Outlet,
  useLocation,
  useRouter,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { memo } from 'react';
import { Helmet } from 'react-helmet-async';

import { runAuthGuard } from '@/initialState.ts';

import Layout from '../layout';

const noLayoutPaths = ['/login'];

/**
 * 判断当前路径是否使用独立页面布局。
 * 项目相关页面需要隐藏侧栏菜单，直接以独立页面展示。
 *
 * @param pathname 当前路径
 * @returns 是否使用独立页面布局
 */
const isStandalonePage = (pathname: string) => {
  if (noLayoutPaths.includes(pathname)) {
    return true;
  }

  return false;
};

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: async (opts) => {
    const { location } = opts;
    await runAuthGuard(location);
  },
});

const LayoutComponent = memo((props: { pathname: string }) => {
  if (isStandalonePage(props.pathname)) {
    return <Outlet />;
  }

  return <Layout />;
});

function RootComponent() {
  const router = useRouter();
  const location = useLocation();
  const routeMap = router.routesByPath as Record<string, { title?: string }>;
  /**
   * 路由生成文件按 path 建立索引。
   * 这里直接读取命中的路由元信息，用于设置页面标题。
   */
  const route = routeMap[location.pathname];

  const title = route?.title ?? '';

  return (
    <>
      <Helmet>
        <title>
          {title ? `${title} - ${process.env.TITLE}` : process.env.TITLE}
        </title>
      </Helmet>

      <LayoutComponent pathname={location.pathname} />

      <TanStackRouterDevtools />
    </>
  );
}
