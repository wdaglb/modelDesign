import { createRouter, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen.ts';

import './app.css';
import { PageLoading } from '@/components';
import NotFound from '@/404.tsx';
import { KModalProvider } from '@/components/KModal';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

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

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <QueryClientProvider client={queryClient}>
        <KModalProvider>
          <RouterProvider router={router} />
        </KModalProvider>
      </QueryClientProvider>
    </ConfigProvider>
  );
};

export default App;
