import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useEffect } from 'react';

import { KDrawerProvider } from '@/components/KDrawer';
import { KModalProvider } from '@/components/KModal';
import { PageLoading } from '@/components';
import NotFound from '@/404.tsx';
import { routeTree } from './routeTree.gen.ts';
import './app.css';
import 'dayjs/locale/zh-cn';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000 * 60,
    },
  },
});
export const router = createRouter({
  routeTree,
  defaultPendingComponent: PageLoading,
  defaultPendingMs: 0,
  defaultNotFoundComponent: NotFound,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

/**
 * 移除 index.html 中的启动 loading。
 *
 * 启动 loading 只用于 React 应用挂载前的过渡展示，
 * 一旦应用已经渲染，就必须立即移除，不能再依赖鉴权分支顺手清理。
 */
const removeBootstrapLoading = () => {
  const pageLoading = document.getElementById('page-loading');
  if (pageLoading && pageLoading.parentNode) {
    pageLoading.parentNode.removeChild(pageLoading);
  }
};

const App = () => {
  useEffect(() => {
    removeBootstrapLoading();
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <QueryClientProvider client={queryClient}>
        <KModalProvider>
          <KDrawerProvider>
            <RouterProvider router={router} />
          </KDrawerProvider>
        </KModalProvider>
      </QueryClientProvider>
    </ConfigProvider>
  );
};

export default App;
