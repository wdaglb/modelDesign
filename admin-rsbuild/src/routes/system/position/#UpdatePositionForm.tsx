import React from 'react';
import { Form, Input, InputNumber, Radio } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiPosition } from '@/api';
import type { Position } from '@/api/modules/position';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface UpdatePositionFormProps {
  /**
   * 当前编辑中的职位记录。
   */
  record: Position;
}

/**
 * 职位修改表单。
 */
const UpdatePositionForm = ({ record }: UpdatePositionFormProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={{
        tenantId: record.tenantId,
        name: record.name,
        code: record.code,
        sort: record.sort,
        remark: record.remark,
        isDisable: record.isDisable ?? false,
      }}
      onFinish={async (values) => {
        await ApiPosition.update(record.id, {
          tenantId: record.tenantId,
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

export default UpdatePositionForm;
