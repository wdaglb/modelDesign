import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Breadcrumb,
  Card,
  Dropdown,
  Result,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { Helmet } from 'react-helmet-async';

import { ApiProject } from '@/api';
import { useKModal } from '@/components/KModal';
import { DatabaseTypeLabel } from '@/api/modules/project.types';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';
import ProjectForm from './components/#ProjectForm';
import TaskCreateForm from './components/#TaskCreateForm';

export const Route = createFileRoute('/project/$projectId')({
  loader: async ({ params }) => {
    const numericProjectId = Number(params.projectId);

    if (!Number.isInteger(numericProjectId) || numericProjectId <= 0) {
      return null;
    }

    return ApiProject.getDetail(numericProjectId);
  },
  component: RouteComponent,
});

export const projectManageTabs = [
  {
    label: '基本信息',
    value: 'overview',
    to: '/project/$projectId',
  },
  {
    label: '任务',
    value: 'tasks',
    to: '/project/$projectId/tasks',
  },
  {
    label: '数据表',
    value: 'tables',
    to: '/project/$projectId/tables',
  },
  {
    label: '成员',
    value: 'members',
    to: '/project/$projectId/members',
  },
] as const;

function RouteComponent() {
  const { projectId } = Route.useParams();
  const modal = useKModal();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = Route.useNavigate();
  const loaderData = Route.useLoaderData();

  // 项目数据库类型标签颜色映射。
  const databaseTypeColors: Record<string, string> = {
    mysql: 'blue',
    postgresql: 'green',
    mongodb: 'orange',
    sqlite: 'purple',
  };

  const numericProjectId = Number(projectId);
  const isValidProjectId =
    Number.isInteger(numericProjectId) && numericProjectId > 0;

  const currentTab =
    projectManageTabs.find((item) => {
      if (item.value === 'overview') {
        return location.pathname === `/project/${projectId}`;
      }
      return location.pathname === `/project/${projectId}/${item.value}`;
    })?.value ?? 'overview';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKey.project.detail(numericProjectId),
    queryFn: () => ApiProject.getDetail(numericProjectId),
    enabled: isValidProjectId,
    initialData: loaderData ?? undefined,
  });

  // 项目切换下拉使用项目列表数据，便于在详情页之间快速跳转。
  const { data: projectListData, isLoading: isProjectListLoading } = useQuery({
    queryKey: [...queryKey.project.list(), 'switcher'],
    queryFn: () => ApiProject.getList({ current: 1, pageSize: 999 }),
  });

  // 项目切换菜单项保持当前页签，减少跨项目切换成本。
  const projectDropdownItems = projectListData?.items.map((item) => ({
    key: String(item.id),
    label: item.name,
  }));

  if (!isValidProjectId) {
    return (
      <>
        <Helmet>
          <title>{`项目管理 - ${process.env.TITLE}`}</title>
        </Helmet>

        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Breadcrumb
            items={[
              { title: <Link to="/">首页</Link> },
              { title: <Link to="/project">项目列表</Link> },
              { title: '项目管理' },
            ]}
          />

          <Card>
            <Result
              status="warning"
              title="项目参数无效"
              subTitle="请从项目列表重新进入项目管理页面。"
              extra={
                <Button type="primary">
                  <Link to="/project">返回项目列表</Link>
                </Button>
              }
            />
          </Card>
        </Space>
      </>
    );
  }

  if (isLoading) {
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </Space>
    );
  }

  if (isError || !data) {
    return (
      <>
        <Helmet>
          <title>{`项目管理 - ${process.env.TITLE}`}</title>
        </Helmet>

        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Breadcrumb
            items={[
              { title: <Link to="/">首页</Link> },
              { title: <Link to="/project">项目列表</Link> },
              { title: '项目管理' },
            ]}
          />

          <Card>
            <Result
              status="error"
              title="项目加载失败"
              subTitle={
                error instanceof Error ? error.message : '暂时无法获取项目详情'
              }
              extra={
                <Space>
                  <Button type="primary">
                    <Link to="/project">返回项目列表</Link>
                  </Button>
                </Space>
              }
            />
          </Card>
        </Space>
      </>
    );
  }

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <Helmet>
        <title>{`${data.name} - 项目管理 - ${process.env.TITLE}`}</title>
      </Helmet>

      <Card styles={{ body: { padding: 20 } }}>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Space
            align="center"
            style={{ width: '100%', justifyContent: 'space-between' }}
            wrap
            size={12}
          >
            <Space align="center" wrap>
              <Button
                type="text"
                icon={<Icons.ArrowLeft />}
                onClick={() => {
                  navigate({ to: '/project' });
                }}
                style={{
                  width: 40,
                  height: 40,
                  border: '1px solid var(--ant-colorBorderSecondary)',
                  borderRadius: 8,
                  background: 'var(--ant-colorFillQuaternary)',
                }}
              />

              <Dropdown
                menu={{
                  items: projectDropdownItems,
                  selectable: true,
                  selectedKeys: [String(data.id)],
                  onClick: ({ key }) => {
                    if (key === String(data.id)) {
                      return;
                    }
                    const target = projectManageTabs.find(
                      (item) => item.value === currentTab,
                    );
                    if (!target) {
                      return;
                    }
                    navigate({
                      to: target.to,
                      params: { projectId: key },
                    });
                  },
                }}
                trigger={['click']}
                disabled={isProjectListLoading}
              >
                <Button
                  type="text"
                  style={{
                    height: 40,
                    paddingInline: 12,
                    border: '1px solid var(--ant-colorBorderSecondary)',
                    borderRadius: 8,
                    background: 'var(--ant-colorFillQuaternary)',
                    margin: '0',
                  }}
                >
                  <Space size={8}>
                    <Typography.Text strong>{data.name}</Typography.Text>
                    <Icons.UnfoldMoreHorizontal />
                  </Space>
                </Button>
              </Dropdown>

              <Tabs
                activeKey={currentTab}
                type={'card'}
                tabBarStyle={{ marginBottom: 0 }}
                items={projectManageTabs.map((item) => ({
                  key: item.value,
                  label: item.label,
                }))}
                onChange={(value) => {
                  const target = projectManageTabs.find(
                    (item) => item.value === value,
                  );
                  if (!target) {
                    return;
                  }
                  navigate({
                    to: target.to,
                    params: { projectId },
                  });
                }}
              />
            </Space>

            <Space
              style={{ width: '100%', justifyContent: 'flex-end' }}
              wrap
              size={12}
            >
              <Button
                type="primary"
                onClick={async () => {
                  await modal.open({
                    title: '编辑项目',
                    children: <ProjectForm record={data} />,
                  });

                  await Promise.all([
                    queryClient.invalidateQueries({
                      queryKey: queryKey.project.detail(numericProjectId),
                    }),
                    queryClient.invalidateQueries({
                      queryKey: queryKey.project.list(),
                    }),
                  ]);
                }}
              >
                编辑项目
              </Button>

              <Button
                icon={<Icons.Plus />}
                onClick={async () => {
                  try {
                    await modal.open({
                      title: '新建任务',
                      width: 960,
                      styles: {
                        body: {
                          height: 580,
                          overflowX: 'hidden',
                          overflowY: 'auto',
                        },
                      },
                      children: <TaskCreateForm projectId={numericProjectId} />,
                    });

                    await Promise.all([
                      queryClient.invalidateQueries({
                        queryKey: queryKey.project.taskList(numericProjectId),
                      }),
                      queryClient.invalidateQueries({
                        queryKey: queryKey.todo.list(),
                      }),
                    ]);
                  } catch (modalError) {
                    if (modalError !== 'KModal cancel') {
                      throw modalError;
                    }
                  }
                }}
              >
                新建任务
              </Button>

              <Button>
                <Link to="/project">返回项目列表</Link>
              </Button>
            </Space>
          </Space>
        </Space>
      </Card>

      <Card styles={{ body: { padding: 20 } }}>
        <Outlet />
      </Card>
    </Space>
  );
}
