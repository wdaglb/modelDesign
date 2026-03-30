import React from 'react';
import { Form, Input, message } from 'antd';

import { ApiPassport } from '@/api';
import KModal from '@/components/KModal';
import { logout } from '@/service/loginService.ts';

interface ChangePasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordForm = () => {
  const [form] = Form.useForm<ChangePasswordFormValues>();

  return (
    <KModal.Form
      form={form}
      layout={'vertical'}
      onFinish={async (values) => {
        await ApiPassport.changePassword({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        });
        message.success('密码修改成功，请重新登录');
        await logout();
        return { success: true };
      }}
    >
      <Form.Item
        name={'oldPassword'}
        label={'当前密码'}
        rules={[{ required: true, message: '请输入当前密码' }]}
      >
        <Input.Password placeholder={'请输入当前密码'} />
      </Form.Item>

      <Form.Item
        name={'newPassword'}
        label={'新密码'}
        rules={[{ required: true, message: '请输入新密码' }]}
      >
        <Input.Password placeholder={'请输入新密码'} />
      </Form.Item>

      <Form.Item
        name={'confirmPassword'}
        label={'确认密码'}
        dependencies={['newPassword']}
        rules={[
          { required: true, message: '请再次输入新密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的新密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password placeholder={'请再次输入新密码'} />
      </Form.Item>
    </KModal.Form>
  );
};

export default ChangePasswordForm;
