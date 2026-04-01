import { Form, message } from 'antd';

import { ApiPassport } from '@/api';
import KModal from '@/components/KModal';
import { logout } from '@/service/loginService.ts';
import ChangePasswordFormFields, {
  ChangePasswordFormValues,
} from './ChangePasswordFormFields.tsx';

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
        return false;
      }}
    >
      <ChangePasswordFormFields />
    </KModal.Form>
  );
};

export default ChangePasswordForm;
