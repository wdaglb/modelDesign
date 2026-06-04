import React, { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Form,
  Input,
  Skeleton,
  Space,
  Switch,
  Typography,
  message,
} from 'antd';

import { ApiGitlab } from '@/api';
import type { GitlabConfigSaveParams } from '@/api/modules/gitlab';
import { PERMISSION_RESOURCE } from '@/constants/permission.ts';
import queryKey from '@/constants/queryKey';
import usePermission from '@/hooks/usePermission.ts';

/**
 * GitLab 配置页面路由。
 */
export const Route = createFileRoute('/system/third-party/gitlab/')({
  component: RouteComponent,
  context: () => {
    return {
      title: 'GitLab 配置',
    };
  },
});

/**
 * GitLab 配置表单值。
 */
interface GitlabConfigFormValues {
  /**
   * GitLab 服务器地址。
   */
  serverUrl: string;

  /**
   * GitLab 访问 Token。
   */
  accessToken?: string;

  /**
   * 是否启用当前配置。
   */
  enabled: boolean;

  /**
   * GitLab provider 编码。
   */
  providerCode: string;

  /**
   * GitLab provider 版本。
   */
  providerVersion: string;
}

function RouteComponent() {
  const [form] = Form.useForm<GitlabConfigFormValues>();
  const queryClient = useQueryClient();
  const { hasButtonPermission } = usePermission();
  const canSave = hasButtonPermission(PERMISSION_RESOURCE.systemGitlabSave);
  const canTest = hasButtonPermission(
    PERMISSION_RESOURCE.systemGitlabTestConnection,
  );

  const currentConfigQuery = useQuery({
    queryKey: queryKey.gitlab.current(),
    queryFn: ApiGitlab.getCurrentConfig,
  });

  const saveMutation = useMutation({
    mutationFn: (values: GitlabConfigSaveParams) => {
      return ApiGitlab.saveCurrentConfig(values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKey.gitlab.current(),
      });
      form.setFieldValue('accessToken', '');
      message.success('GitLab 配置保存成功');
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: ApiGitlab.testConnection,
    onSuccess: (result) => {
      message.success(result.message || 'GitLab 连接成功');
    },
  });

  useEffect(() => {
    if (currentConfigQuery.data) {
      form.setFieldsValue({
        serverUrl: currentConfigQuery.data.serverUrl,
        accessToken: '',
        enabled: currentConfigQuery.data.enabled,
        providerCode: currentConfigQuery.data.providerCode || 'gitlab-v4',
        providerVersion: currentConfigQuery.data.providerVersion || '1.0.0',
      });
      return;
    }

    form.setFieldsValue({
      serverUrl: '',
      accessToken: '',
      enabled: true,
      providerCode: 'gitlab-v4',
      providerVersion: '1.0.0',
    });
  }, [currentConfigQuery.data, form]);

  if (currentConfigQuery.isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (currentConfigQuery.isError) {
    return (
      <Card>
        <Space>
          <Typography.Text type={'danger'}>
            GitLab 配置加载失败，请稍后重试。
          </Typography.Text>
          <Button onClick={() => currentConfigQuery.refetch()}>重试</Button>
        </Space>
      </Card>
    );
  }

  return (
    <Card>
      <Space orientation={'vertical'} size={20} style={{ width: '100%' }}>
        {!currentConfigQuery.data && (
          <Typography.Text type={'secondary'}>
            当前租户还没有 GitLab 配置，首次保存时必须填写 Token。
          </Typography.Text>
        )}

        <Form<GitlabConfigFormValues>
          form={form}
          layout={'vertical'}
          onFinish={async (values) => {
            if (!canSave) {
              return;
            }
            const payload: GitlabConfigSaveParams = {
              serverUrl: values.serverUrl.trim(),
              enabled: values.enabled,
              providerCode: values.providerCode.trim(),
              providerVersion: values.providerVersion.trim(),
            };
            if (values.accessToken?.trim()) {
              payload.accessToken = values.accessToken.trim();
            }
            await saveMutation.mutateAsync(payload);
          }}
        >
          <Form.Item
            name={'serverUrl'}
            label={'GitLab 服务器地址'}
            rules={[{ required: true, message: '请输入 GitLab 服务器地址' }]}
            extra={'示例：https://gitlab.example.com，不需要填写 /api/v4。'}
          >
            <Input
              placeholder={'请输入 GitLab 服务器地址'}
              autoComplete={'off'}
            />
          </Form.Item>

          <Form.Item
            name={'accessToken'}
            label={'Access Token'}
            rules={[
              {
                validator: async (_, value) => {
                  if (currentConfigQuery.data) {
                    return;
                  }
                  if (value?.trim()) {
                    return;
                  }
                  throw new Error('首次配置 GitLab 时请输入 Access Token');
                },
              },
            ]}
            extra={'更新配置时留空表示不修改现有 Token；填写新 Token 会替换旧 Token。'}
          >
            <Input.Password
              placeholder={'请输入 GitLab Access Token'}
              autoComplete={'new-password'}
            />
          </Form.Item>

          <Form.Item
            name={'providerCode'}
            label={'Provider 编码'}
            rules={[{ required: true, message: '请输入 Provider 编码' }]}
            extra={'用于匹配预置目录中的 GitLab provider，例如 gitlab-v4。'}
          >
            <Input placeholder={'gitlab-v4'} autoComplete={'off'} />
          </Form.Item>

          <Form.Item
            name={'providerVersion'}
            label={'Provider 版本'}
            rules={[{ required: true, message: '请输入 Provider 版本' }]}
            extra={'用于匹配预置目录中的 provider 版本，例如 1.0.0。'}
          >
            <Input placeholder={'1.0.0'} autoComplete={'off'} />
          </Form.Item>

          <Form.Item
            name={'enabled'}
            label={'启用配置'}
            valuePropName={'checked'}
            extra={'关闭后，测试连接会因配置未启用而不可用。'}
          >
            <Switch checkedChildren={'已启用'} unCheckedChildren={'已停用'} />
          </Form.Item>

          <Space>
            {canSave && (
              <Button
                type={'primary'}
                htmlType={'submit'}
                loading={saveMutation.isPending}
              >
                保存配置
              </Button>
            )}
            {canTest && (
              <Button
                loading={testConnectionMutation.isPending}
                disabled={!currentConfigQuery.data}
                onClick={() => testConnectionMutation.mutate()}
              >
                测试连接
              </Button>
            )}
            <Button
              onClick={() => {
                if (currentConfigQuery.data) {
                  form.setFieldsValue({
                    serverUrl: currentConfigQuery.data.serverUrl,
                    accessToken: '',
                    enabled: currentConfigQuery.data.enabled,
                    providerCode:
                      currentConfigQuery.data.providerCode || 'gitlab-v4',
                    providerVersion:
                      currentConfigQuery.data.providerVersion || '1.0.0',
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
