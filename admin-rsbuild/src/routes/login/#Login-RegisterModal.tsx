import { Form, Input, Modal, message } from 'antd';

interface RegisterFormValues {
  nickname: string;
  username: string;
  mobile: string;
}

interface LoginRegisterModalProps {
  open: boolean;
  onClose: () => void;
}

/** 注册弹窗仅提供展示级表单交互，不发起真实注册请求 */
function LoginRegisterModal(props: LoginRegisterModalProps) {
  const [form] = Form.useForm<RegisterFormValues>();

  const handleOk = async () => {
    try {
      await form.validateFields();
      message.success('注册成功（展示级）');
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
      title="注册账号"
      open={props.open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="注册"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="nickname"
          label="名字"
          rules={[{ required: true, message: '请输入名字' }]}
        >
          <Input placeholder="请输入名字" autoFocus />
        </Form.Item>
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input placeholder="请输入用户名" />
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

export default LoginRegisterModal;
