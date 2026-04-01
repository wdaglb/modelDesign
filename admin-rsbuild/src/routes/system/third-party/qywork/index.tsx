import React, { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Descriptions, Form, Input, Skeleton, Space, Typography, message } from 'antd';
import { createFileRoute } from '@tanstack/react-router';

import { ApiQywork } from '@/api';
import type { QyworkConfigSaveParams } from '@/api/modules/qywork';
import queryKey from '@/constants/queryKey';
import useAuthStore from '@/store/auth.ts';

/**
 * 企业微信配置页面路由。
 */
export const Route = createFileRoute('/system/third-party/qywork/')({
  component: RouteComponent,
  context: () => {
    return {
      title: '企业微信配置',
    };
  },
});

/**
 * 企业微信配置表单值。
 */
interface QyworkConfigFormValues {
  /**
   * 企业微信 corpId。
   */
  corpId: string;

  /**
   * 企业微信 corpSecret。
   */
  corpSecret: string;

  /**
   * 备注。
   */
  remark?: string;
}

function RouteComponent() {
  const [form] = Form.useForm<QyworkConfigFormValues>();
  const queryClient = useQueryClient();
  const currentInfo = useAuthStore((state) => state.currentInfo);

  const currentConfigQuery = useQuery({
    queryKey: queryKey.qywork.current(),
    queryFn: ApiQywork.getCurrentConfig,
  });

  const saveMutation = useMutation({
    mutationFn: (values: QyworkConfigSaveParams) => {
      return ApiQywork.saveCurrentConfig(values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKey.qywork.current(),
      });
      message.success('企业微信配置保存成功');
    },
  });

  useEffect(() => {
    if (currentConfigQuery.data) {
      form.setFieldsValue({
        corpId: currentConfigQuery.data.corpId,
        corpSecret: currentConfigQuery.data.corpSecret,
        remark: currentConfigQuery.data.remark,
      });
      return;
    }

    form.setFieldsValue({
      corpId: '',
      corpSecret: '',
      remark: '',
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
        <Alert
          type={'error'}
          showIcon
          message={'企业微信配置加载失败，请稍后重试。'}
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
          message={'access_token 仅在后端内部缓存和使用，前端只维护企业微信基础配置。'}
        />

        <Descriptions bordered size={'small'} column={2}>
          <Descriptions.Item label={'当前租户 ID'}>
            {currentInfo?.tenantId ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label={'配置状态'}>
            {currentConfigQuery.data ? '已配置' : '未配置'}
          </Descriptions.Item>
          <Descriptions.Item label={'创建时间'}>
            {currentConfigQuery.data?.createTime || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={'更新时间'}>
            {currentConfigQuery.data?.updateTime || '-'}
          </Descriptions.Item>
        </Descriptions>

        {!currentConfigQuery.data && (
          <Typography.Text type={'secondary'}>
            当前租户还没有企业微信配置，填写后保存即可完成首次接入。
          </Typography.Text>
        )}

        <Form<QyworkConfigFormValues>
          form={form}
          layout={'vertical'}
          onFinish={async (values) => {
            await saveMutation.mutateAsync({
              corpId: values.corpId.trim(),
              corpSecret: values.corpSecret.trim(),
              remark: values.remark?.trim() || '',
            });
          }}
        >
          <Form.Item
            name={'corpId'}
            label={'Corp ID'}
            rules={[{ required: true, message: '请输入企业微信 Corp ID' }]}
          >
            <Input
              placeholder={'请输入企业微信 Corp ID'}
              autoComplete={'off'}
            />
          </Form.Item>

          <Form.Item
            name={'corpSecret'}
            label={'Corp Secret'}
            rules={[
              { required: true, message: '请输入企业微信 Corp Secret' },
            ]}
            extra={'该字段会明文保存并回显，请谨慎授权和管理。'}
          >
            <Input.Password
              placeholder={'请输入企业微信 Corp Secret'}
              autoComplete={'new-password'}
            />
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
                    corpId: currentConfigQuery.data.corpId,
                    corpSecret: currentConfigQuery.data.corpSecret,
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
