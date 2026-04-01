import { Form, Input } from 'antd';

/**
 * 修改密码表单值。
 */
export interface ChangePasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 修改密码表单字段。
 */
const ChangePasswordFormFields = () => {
  return (
    <>
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
              if (!value) {
                return Promise.resolve();
              }
              if (getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的新密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password placeholder={'请再次输入新密码'} />
      </Form.Item>
    </>
  );
};

export default ChangePasswordFormFields;
