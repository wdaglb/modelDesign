import React, { useMemo } from 'react';
import { Form, Input, Radio } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiTenant } from '@/api';
import type { Tenant } from '@/api/modules/tenant';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface UpdateTenantFormProps {
  /**
   * 当前编辑中的租户记录。
   */
  record: Tenant;
}

interface UpdateTenantFormValues {
  /**
   * 租户编码。
   */
  code: string;

  /**
   * 租户名称。
   */
  name: string;

  /**
   * 租户描述。
   */
  description?: string;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 租户编辑表单。
 */
const UpdateTenantForm = ({ record }: UpdateTenantFormProps) => {
  const [form] = Form.useForm<UpdateTenantFormValues>();
  const queryClient = useQueryClient();

  const statusOptions = useMemo(() => {
    const options = [
      { label: '启用', value: false },
      { label: '禁用', value: true },
    ];
    if (record.id === 1) {
      options[1] = {
        ...options[1],
        disabled: true,
      };
    }
    return options;
  }, [record.id]);

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={{
        code: record.code,
        name: record.name,
        description: record.description,
        isDisable: record.isDisable ?? false,
      }}
      onFinish={async (values) => {
        await ApiTenant.update(record.id, {
          code: values.code.trim(),
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          isDisable: values.isDisable,
        });
        await queryClient.invalidateQueries({
          queryKey: queryKey.tenant.list(),
        });
        await queryClient.invalidateQueries({
          queryKey: queryKey.tenant.options(),
        });
        await queryClient.invalidateQueries({
          queryKey: queryKey.user.list(),
        });
      }}
    >
      <Form.Item
        name={'code'}
        label={'租户编码'}
        rules={[{ required: true, message: '请输入租户编码' }]}
      >
        <Input placeholder={'请输入租户编码'} autoFocus />
      </Form.Item>

      <Form.Item
        name={'name'}
        label={'租户名称'}
        rules={[{ required: true, message: '请输入租户名称' }]}
      >
        <Input placeholder={'请输入租户名称'} />
      </Form.Item>

      <Form.Item name={'description'} label={'租户描述'}>
        <Input.TextArea placeholder={'请输入租户描述'} rows={4} />
      </Form.Item>

      <Form.Item
        name={'isDisable'}
        label={'状态'}
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Radio.Group optionType={'button'} options={statusOptions} />
      </Form.Item>
    </KModal.Form>
  );
};

export default UpdateTenantForm;
