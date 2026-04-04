import { Form, Input, Modal, message } from 'antd';

interface ForgotFormValues {
  username: string;
  mobile: string;
}

interface LoginForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

/** 找回密码弹窗仅提供展示级表单交互，不发起真实请求 */
function LoginForgotPasswordModal(props: LoginForgotPasswordModalProps) {
  const [form] = Form.useForm<ForgotFormValues>();

  const handleOk = async () => {
    try {
      await form.validateFields();
      message.success('重置链接已发送（展示级）');
      form.resetFields();
      props.onClose();
    } catch {
      /** 校验失败，不关闭弹窗 */
    }
  };

  const handleCancel = () => {
    form.resetFields();
    props.onClose();
  };

  return (
    <Modal
      title="找回密码"
      open={props.open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="提交"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder="请输入用户名" autoFocus />
        </Form.Item>
        <Form.Item
          name="mobile"
          label="手机号"
          rules={[{ required: true, message: '请输入手机号' }]}
        >
          <Input placeholder="请输入手机号" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default LoginForgotPasswordModal;
