import React from 'react';
import { Form, Input, Radio } from 'antd';

import { ApiUser } from '@/api';
import { User } from '@/api/modules/user';
import KModal from '@/components/KModal';

interface UpdateUserFormProps {
  /**
   * 当前编辑中的用户记录。
   */
  record: User;
}

/**
 * 用户修改表单。
 *
 * 与新增逻辑拆分后，这里只保留编辑场景需要的字段和交互，
 * 密码保持“留空表示不修改”的既有语义。
 */
const UpdateUserForm = ({ record }: UpdateUserFormProps) => {
  const [form] = Form.useForm();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      initialValues={{
        nickname: record.nickname,
        username: record.username,
        tenantId: record.tenantId,
        isDisable: record.isDisable ?? false,
      }}
      onFinish={async (values) => {
        await ApiUser.update(record.id, values);
      }}
    >
      <Form.Item
        name={'nickname'}
        label={'昵称'}
        rules={[{ required: true, message: '请输入昵称' }]}
      >
        <Input placeholder={'请输入昵称'} autoFocus />
      </Form.Item>

      <Form.Item
        name={'username'}
        label={'用户名'}
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input placeholder={'请输入用户名'} />
      </Form.Item>

      <Form.Item
        name={'password'}
        label={'密码'}
        extra={'留空表示不修改密码'}
      >
        <Input.Password placeholder={'留空则不修改'} />
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

export default UpdateUserForm;
