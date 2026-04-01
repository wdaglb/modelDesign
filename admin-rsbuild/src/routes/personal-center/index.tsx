import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Skeleton, Space, Tabs } from 'antd';
import { z } from 'zod';

import { ApiPassport } from '@/api';
import type { CurrentInfoVo } from '@/api/modules/passport.types.ts';
import queryKey from '@/constants/queryKey';
import useAuthStore from '@/store/auth.ts';

import AccountSummary from './#AccountSummary';
import BasicInfoTab from './#BasicInfoTab';
import SecurityTab from './#SecurityTab';
import ThirdPartyTab from './#ThirdPartyTab';

const personalCenterTabValues = ['basic', 'third-party', 'security'] as const;

type PersonalCenterTabKey = (typeof personalCenterTabValues)[number];

const searchSchema = z.object({
  tab: z
    .enum(personalCenterTabValues)
    .catch('basic')
    .optional()
    .default('basic'),
});

/**
 * 个人中心路由。
 */
export const Route = createFileRoute('/personal-center/')({
  component: RouteComponent,
  validateSearch: searchSchema,
  context: () => {
    return {
      title: '个人中心',
    };
  },
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const currentInfo = useAuthStore((state) => state.currentInfo);
  const setCurrentInfo = useAuthStore((state) => state.setCurrentInfo);

  const currentInfoQuery = useQuery({
    queryKey: queryKey.passport.currentInfo(),
    queryFn: ApiPassport.getCurrentUser,
    initialData: currentInfo,
  });

  useEffect(() => {
    if (!currentInfoQuery.data) {
      return;
    }
    setCurrentInfo(currentInfoQuery.data);
  }, [currentInfoQuery.data, setCurrentInfo]);

  if (currentInfoQuery.isLoading && !currentInfoQuery.data) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (currentInfoQuery.isError) {
    return (
      <Card>
        <Alert
          type={'error'}
          showIcon
          message={getErrorMessage(currentInfoQuery.error)}
          action={<Button onClick={() => currentInfoQuery.refetch()}>重试</Button>}
        />
      </Card>
    );
  }

  return (
    <Space direction={'vertical'} size={16} style={{ width: '100%' }}>
      <AccountSummary currentInfo={currentInfoQuery.data} />

      <Card styles={{ body: { padding: 20 } }}>
        <Tabs
          activeKey={search.tab}
          items={buildTabItems(currentInfoQuery.data, (nextCurrentInfo) => {
            queryClient.setQueryData(
              queryKey.passport.currentInfo(),
              nextCurrentInfo,
            );
            setCurrentInfo(nextCurrentInfo);
          })}
          onChange={(nextKey) => {
            navigate({
              search: (previous) => {
                return {
                  ...previous,
                  tab: resolveTabKey(nextKey),
                };
              },
            });
          }}
        />
      </Card>
    </Space>
  );
}

const buildTabItems = (
  currentInfo: CurrentInfoVo | undefined,
  onUpdated: (currentInfo: CurrentInfoVo) => void,
) => {
  return [
    {
      key: 'basic',
      label: '基础信息',
      children: <BasicInfoTab currentInfo={currentInfo} onUpdated={onUpdated} />,
    },
    {
      key: 'third-party',
      label: '第三方账号',
      children: <ThirdPartyTab />,
    },
    {
      key: 'security',
      label: '安全设置',
      children: <SecurityTab currentInfo={currentInfo} />,
    },
  ];
};

const resolveTabKey = (value: string): PersonalCenterTabKey => {
  if (value === 'third-party') {
    return 'third-party';
  }
  if (value === 'security') {
    return 'security';
  }
  return 'basic';
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '个人中心加载失败，请稍后重试。';
};
