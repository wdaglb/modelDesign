import React from 'react';
import { Form, Input, InputNumber, Radio } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiRole } from '@/api';
import { Role } from '@/api/modules/role';
import KModal from '@/components/KModal';
import queryKey from '@/constants/queryKey';

interface UpdateRoleFormProps {
  /**
   * 当前编辑中的角色记录。
   */
  record: Role;
}

/**
 * 角色修改表单。
 */
const UpdateRoleForm = ({ record }: UpdateRoleFormProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={{
        name: record.name,
        code: record.code,
        sort: record.sort,
        remark: record.remark,
        isDisable: record.isDisable ?? false,
      }}
      onFinish={async (values) => {
        await ApiRole.update(record.id, {
          ...values,
          code: values.code.trim(),
          name: values.name.trim(),
          remark: values.remark?.trim() || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: queryKey.role.list() });
      }}
    >
      <Form.Item
        name={'name'}
        label={'角色名称'}
        rules={[{ required: true, message: '请输入角色名称' }]}
      >
        <Input placeholder={'请输入角色名称'} autoFocus />
      </Form.Item>

      <Form.Item
        name={'code'}
        label={'角色编码'}
        rules={[{ required: true, message: '请输入角色编码' }]}
      >
        <Input placeholder={'请输入角色编码'} />
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

export default UpdateRoleForm;
