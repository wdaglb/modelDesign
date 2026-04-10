import React, { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Skeleton,
  Space,
  Typography,
  message,
} from 'antd';
import { createFileRoute } from '@tanstack/react-router';

import { ApiFileAccessConfig } from '@/api';
import type { FileAccessConfigSaveParams } from '@/api/modules/file-access-config';
import queryKey from '@/constants/queryKey';
import useAuthStore from '@/store/auth.ts';

/**
 * 文件访问配置页面路由。
 */
export const Route = createFileRoute('/system/file-config/')({
  component: RouteComponent,
  context: () => {
    return {
      title: '文件访问配置',
    };
  },
});

/**
 * 文件访问配置表单值。
 */
interface FileAccessConfigFormValues {
  /**
   * 文件访问域名。
   */
  accessDomain: string;

  /**
   * 备注。
   */
  remark?: string;
}

function RouteComponent() {
  const [form] = Form.useForm<FileAccessConfigFormValues>();
  const queryClient = useQueryClient();
  const currentInfo = useAuthStore((state) => state.currentInfo);

  const currentConfigQuery = useQuery({
    queryKey: queryKey.fileAccessConfig.current(),
    queryFn: ApiFileAccessConfig.getCurrentConfig,
  });

  const saveMutation = useMutation({
    mutationFn: (values: FileAccessConfigSaveParams) => {
      return ApiFileAccessConfig.saveCurrentConfig(values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKey.fileAccessConfig.current(),
      });
      message.success('文件访问配置保存成功');
    },
  });

  useEffect(() => {
    if (currentConfigQuery.data) {
      form.setFieldsValue({
        accessDomain: currentConfigQuery.data.accessDomain,
        remark: currentConfigQuery.data.remark,
      });
      return;
    }

    form.setFieldsValue({
      accessDomain: '',
      remark: '',
    });
  }, [currentConfigQuery.data, form]);

  if (currentConfigQuery.isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (currentConfigQuery.isError) {
    return (
      <Card>
        <Alert
          type={'error'}
          showIcon
          message={'文件访问配置加载失败，请稍后重试。'}
          action={
            <Button onClick={() => currentConfigQuery.refetch()}>重试</Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card>
      <Space direction={'vertical'} size={20} style={{ width: '100%' }}>
        <Alert
          type={'info'}
          showIcon
          message={'该配置用于为 Markdown 图片和图片缩略图拼接完整访问地址。'}
          description={
            '附件下载仍保留 /api 代理，以确保登录态鉴权和现有下载行为不受影响。'
          }
        />

        <Descriptions bordered size={'small'} column={2}>
          <Descriptions.Item label={'当前租户 ID'}>
            {resolveTenantDisplayText(currentInfo?.tenantId)}
          </Descriptions.Item>
          <Descriptions.Item label={'配置状态'}>
            {resolveConfigStatus(currentConfigQuery.data)}
          </Descriptions.Item>
          <Descriptions.Item label={'当前访问域名'}>
            {resolveDisplayText(currentConfigQuery.data?.accessDomain)}
          </Descriptions.Item>
          <Descriptions.Item label={'更新时间'}>
            {resolveDisplayText(currentConfigQuery.data?.updateTime)}
          </Descriptions.Item>
          <Descriptions.Item label={'创建时间'}>
            {resolveDisplayText(currentConfigQuery.data?.createTime)}
          </Descriptions.Item>
          <Descriptions.Item label={'备注'}>
            {resolveDisplayText(currentConfigQuery.data?.remark)}
          </Descriptions.Item>
        </Descriptions>

        {!currentConfigQuery.data && (
          <Typography.Text type={'secondary'}>
            当前租户还没有文件访问配置，填写后保存即可启用图片地址拼接。
          </Typography.Text>
        )}

        <Form<FileAccessConfigFormValues>
          form={form}
          layout={'vertical'}
          onFinish={async (values) => {
            await saveMutation.mutateAsync({
              accessDomain: values.accessDomain.trim(),
              remark: normalizeOptionalText(values.remark),
            });
          }}
        >
          <Form.Item
            name={'accessDomain'}
            label={'访问域名'}
            rules={[
              { required: true, message: '请输入文件访问域名' },
              { validator: validateAccessDomain },
            ]}
            extra={
              '示例：http://localhost:9999。保存后，前端会用它拼接图片访问地址。'
            }
          >
            <Input placeholder={'请输入文件访问域名'} autoComplete={'off'} />
          </Form.Item>

          <Form.Item name={'remark'} label={'备注'}>
            <Input.TextArea
              placeholder={'请输入备注'}
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Space>
            <Button
              type={'primary'}
              htmlType={'submit'}
              loading={saveMutation.isPending}
            >
              保存配置
            </Button>
            <Button
              onClick={() => {
                if (currentConfigQuery.data) {
                  form.setFieldsValue({
                    accessDomain: currentConfigQuery.data.accessDomain,
                    remark: currentConfigQuery.data.remark,
                  });
                  return;
                }

                form.resetFields();
              }}
            >
              重置
            </Button>
          </Space>
        </Form>
      </Space>
    </Card>
  );
}

async function validateAccessDomain(_: unknown, value?: string) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    throw new Error('访问域名必须是完整的 http 或 https 地址');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('访问域名必须以 http:// 或 https:// 开头');
  }
}

function normalizeOptionalText(value?: string) {
  if (!value) {
    return '';
  }

  return value.trim();
}

function resolveConfigStatus(
  config: Awaited<ReturnType<typeof ApiFileAccessConfig.getCurrentConfig>>,
) {
  if (config) {
    return '已配置';
  }

  return '未配置';
}

function resolveTenantDisplayText(tenantId?: number) {
  if (tenantId === undefined || tenantId === null) {
    return '-';
  }

  return tenantId;
}

function resolveDisplayText(value?: string) {
  if (!value) {
    return '-';
  }

  return value;
}
