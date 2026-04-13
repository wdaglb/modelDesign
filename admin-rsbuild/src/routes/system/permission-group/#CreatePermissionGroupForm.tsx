import React from 'react';
import { Form, Input, InputNumber, Radio } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiPermissionGroup } from '@/api';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface FormValues {
  name: string;
  code: string;
  sort: number;
  remark?: string;
  isDisable: boolean;
}

/**
 * 新增权限资源组表单。
 */
const CreatePermissionGroupForm = () => {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={{
        sort: 0,
        isDisable: false,
      }}
      onFinish={async (values) => {
        await ApiPermissionGroup.add({
          ...values,
          name: values.name.trim(),
          code: values.code.trim(),
          remark: values.remark?.trim() || undefined,
        });
        await queryClient.invalidateQueries({
          queryKey: queryKey.permissionGroup.list(),
        });
      }}
    >
      <Form.Item
        name={'name'}
        label={'资源组名称'}
        rules={[{ required: true, message: '请输入资源组名称' }]}
      >
        <Input placeholder={'请输入资源组名称'} autoFocus />
      </Form.Item>

      <Form.Item
        name={'code'}
        label={'资源组编码'}
        rules={[{ required: true, message: '请输入资源组编码' }]}
      >
        <Input placeholder={'请输入资源组编码'} />
      </Form.Item>

      <Form.Item
        name={'sort'}
        label={'排序'}
        rules={[{ required: true, message: '请输入排序值' }]}
      >
        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name={'remark'} label={'备注'}>
        <Input.TextArea placeholder={'请输入备注'} rows={4} />
      </Form.Item>

      <Form.Item
        name={'isDisable'}
        label={'状态'}
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Radio.Group
          optionType={'button'}
          options={[
            { label: '启用', value: false },
            { label: '禁用', value: true },
          ]}
        />
      </Form.Item>
    </KModal.Form>
  );
};

export default CreatePermissionGroupForm;
