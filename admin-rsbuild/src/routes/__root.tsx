import {
  createRootRoute,
  Outlet,
  ParsedLocation,
  useLocation,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Helmet } from 'react-helmet-async';
import Layout from '../layout';
import useAuthStore from '@/store/auth.ts';
import { memo } from 'react';
import initialState from '@/initialState.ts';
import { PageLoading } from '@/components';
import { initErrorHandler } from '@/service/loginService.ts';
import { useQuery } from '@tanstack/react-query';

// 不需要布局的固定路径
const noLayoutPaths = ['/login'];

/**
 * 判断当前路径是否使用独立页面布局。
 * 项目相关页面需要隐藏侧栏菜单，直接以独立页面展示。
 */
const isStandalonePage = (pathname: string) => {
  if (noLayoutPaths.includes(pathname)) {
    return true;
  }

  return false;
};

const loginHandle = async (location: ParsedLocation) => {
  try {
    await initialState({ location });
  } catch (err) {
    await initErrorHandler(err);
  }
};

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: async (opts) => {
    const { context, location } = opts;
    const authStore = useAuthStore.getState();
    if (!authStore.currentInfo && authStore.loadState === 0) {
      await loginHandle(location);
    }
  },
});

const LayoutComponent = memo(
  (props: { pathname: string; loading: boolean }) => {
    if (isStandalonePage(props.pathname)) {
      return <Outlet />;
    }
    if (props.loading) {
      return <PageLoading />;
    }
    return <Layout />;
  },
);

function RootComponent() {
  const router = useRouter();
  const location = useLocation();
  // @ts-ignore
  const route = router.routesByPath[location.pathname];
  const navigate = useNavigate();

  const title = route?.title ?? '';

  const { isLoading } = useQuery({
    queryKey: ['initState'],
    staleTime: 0,
    enabled: location.pathname !== '/login',
    queryFn: async () => {
      await loginHandle(location);
    },
  });

  return (
    <>
      <Helmet>
        <title>
          {title ? `${title} - ${process.env.TITLE}` : process.env.TITLE}
        </title>
      </Helmet>

      <LayoutComponent pathname={location.pathname} loading={isLoading} />

      <TanStackRouterDevtools />
    </>
  );
}
