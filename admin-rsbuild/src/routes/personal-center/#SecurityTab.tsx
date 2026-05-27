import { useMutation, useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { Alert, Button, Card, Descriptions, Form, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { ApiPassport } from '@/api';
import type {
  CurrentInfoVo,
  LoginHistoryVo,
} from '@/api/modules/passport.types.ts';
import queryKey from '@/constants/queryKey';
import ChangePasswordFormFields, {
  ChangePasswordFormValues,
} from '@/layout/components/ChangePasswordFormFields.tsx';
import {
  formatBrowserDisplay,
  formatDeviceTypeDisplay,
  formatLoginTypeDisplay,
  formatOsDisplay,
} from '@/routes/personal-center/components/loginHistoryDisplay.helper';
import { logout } from '@/service/loginService.ts';

interface SecurityTabProps {
  currentInfo?: CurrentInfoVo;
}

/**
 * 安全设置页签。
 */
const SecurityTab = (props: SecurityTabProps) => {
  const [form] = Form.useForm<ChangePasswordFormValues>();

  const changePasswordMutation = useMutation({
    mutationFn: ApiPassport.changePassword,
    onSuccess: async () => {
      message.success('密码修改成功，请重新登录');
      await logout();
    },
  });

  const loginHistoryQuery = useQuery({
    queryKey: queryKey.passport.loginHistory(),
    queryFn: ApiPassport.getLoginHistory,
  });

  return (
    <Space orientation={'vertical'} size={16} style={{ width: '100%' }}>
      <Card title={'当前会话'}>
        <Descriptions column={2} size={'small'}>
          <Descriptions.Item label={'登录 IP'}>
            {getDisplayText(props.currentInfo?.loginIp)}
          </Descriptions.Item>
          <Descriptions.Item label={'登录时间'}>
            {formatDateTime(props.currentInfo?.tokenCreateTime)}
          </Descriptions.Item>
          <Descriptions.Item label={'登录流水号'} span={2}>
            {getDisplayText(props.currentInfo?.loginId)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={'修改密码'}>
        <Typography.Text type={'secondary'}>
          修改密码成功后，当前登录会话会立即失效，需要重新登录。
        </Typography.Text>

        <Form<ChangePasswordFormValues>
          form={form}
          layout={'vertical'}
          style={{ marginTop: 20 }}
          onFinish={async (values) => {
            await changePasswordMutation.mutateAsync({
              oldPassword: values.oldPassword,
              newPassword: values.newPassword,
            });
          }}
        >
          <ChangePasswordFormFields />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  form.resetFields();
                }}
              >
                重置
              </Button>
              <Button
                type={'primary'}
                htmlType={'submit'}
                loading={changePasswordMutation.isPending}
              >
                更新密码
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title={'最近登录历史'}>
        {renderLoginHistoryContent(loginHistoryQuery)}
      </Card>
    </Space>
  );
};

const renderLoginHistoryContent = (query: UseQueryResult<LoginHistoryVo[]>) => {
  if (query.isLoading) {
    return <Typography.Text type={'secondary'}>登录历史加载中...</Typography.Text>;
  }

  if (query.isError) {
    return (
      <Alert
        type={'error'}
        showIcon
        message={'登录历史加载失败，请稍后重试。'}
        action={<Button onClick={() => query.refetch()}>重试</Button>}
      />
    );
  }

  return (
    <Table<LoginHistoryVo>
      rowKey={'loginId'}
      size={'small'}
      pagination={false}
      columns={loginHistoryColumns}
      dataSource={query.data || []}
    />
  );
};

const loginHistoryColumns: ColumnsType<LoginHistoryVo> = [
  {
    title: '登录时间',
    dataIndex: 'loginTime',
    key: 'loginTime',
    render: (value: string) => formatDateTime(value),
  },
  {
    title: '登录方式',
    dataIndex: 'loginType',
    key: 'loginType',
    render: (value: string) => formatLoginTypeDisplay(value),
  },
  {
    title: '浏览器',
    dataIndex: 'browserName',
    key: 'browserName',
    render: (_, record) => {
      return formatBrowserDisplay(record.browserName, record.browserVersion);
    },
  },
  {
    title: '操作系统',
    dataIndex: 'osName',
    key: 'osName',
    render: (_, record) => {
      return formatOsDisplay(record.osName, record.osVersion);
    },
  },
  {
    title: '设备类型',
    dataIndex: 'deviceType',
    key: 'deviceType',
    render: (value: string) => formatDeviceTypeDisplay(value),
  },
  {
    title: '登录 IP',
    dataIndex: 'loginIp',
    key: 'loginIp',
    render: (value: string) => getDisplayText(value),
  },
  {
    title: '登录流水号',
    dataIndex: 'loginId',
    key: 'loginId',
    render: (value: string) => getDisplayText(value),
  },
];

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const formatted = dayjs(value);
  if (!formatted.isValid()) {
    return value;
  }
  return formatted.format('YYYY-MM-DD HH:mm:ss');
};

const getDisplayText = (value?: string | number) => {
  if (value === undefined) {
    return '-';
  }
  if (value === null) {
    return '-';
  }
  if (value === '') {
    return '-';
  }
  return String(value);
};

export default SecurityTab;
