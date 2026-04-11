import React from 'react';
import { Form, Input, InputNumber, Radio } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiPosition } from '@/api';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';
import useAuthStore from '@/store/auth.ts';

interface CreatePositionFormValues {
  /**
   * 所属租户 ID。
   */
  tenantId: number;

  /**
   * 职位名称。
   */
  name: string;

  /**
   * 职位编码。
   */
  code: string;

  /**
   * 排序值。
   */
  sort: number;

  /**
   * 职位备注。
   */
  remark?: string;

  /**
   * 是否禁用。
   */
  isDisable: boolean;
}

/**
 * 职位新增表单。
 */
const CreatePositionForm = () => {
  const [form] = Form.useForm<CreatePositionFormValues>();
  const queryClient = useQueryClient();
  const currentInfo = useAuthStore((state) => state.currentInfo);

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={{
        sort: 0,
        isDisable: false,
      }}
      onFinish={async (values) => {
        await ApiPosition.add({
          tenantId: currentInfo?.tenantId || values.tenantId,
          name: values.name.trim(),
          code: values.code.trim(),
          sort: values.sort,
          remark: values.remark?.trim() || undefined,
          isDisable: values.isDisable,
        });
        await queryClient.invalidateQueries({
          queryKey: queryKey.position.list(),
        });
      }}
    >
      <Form.Item
        name={'name'}
        label={'职位名称'}
        rules={[{ required: true, message: '请输入职位名称' }]}
      >
        <Input placeholder={'请输入职位名称'} autoFocus />
      </Form.Item>

      <Form.Item
        name={'code'}
        label={'职位编码'}
        rules={[{ required: true, message: '请输入职位编码' }]}
      >
        <Input placeholder={'请输入职位编码'} />
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

export default CreatePositionForm;
