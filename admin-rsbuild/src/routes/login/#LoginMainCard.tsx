import { Button, Form, Input } from 'antd';

import {
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
  CardWrapper,
  StyledForm,
  StyledSubmitButton,
  WarningBanner,
} from './#login-form.styled';

export interface LoginFormValues {
  username: string;
  password: string;
}

interface LoginMainCardProps {
  loading: boolean;
  errorMessage?: string;
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
  onOpenRegister: () => void;
  onOpenForgot: () => void;
  onSwitchToQR: () => void;
}

/** 登录主卡片只负责输入与入口触发，不负责 token 持久化与路由跳转 */
function LoginMainCard(props: LoginMainCardProps) {
  /**
   * styled-components 包装 antd Form 后会丢失 Form 泛型，
   * onFinish 入参被推导为 unknown，这里显式桥接回登录表单值类型。
   */
  const handleFinish = (values: unknown) => {
    return props.onSubmit(values as LoginFormValues);
  };

  return (
    <CardWrapper>
      <CardHeader>
        <CardEyebrow>AUTHENTICATION</CardEyebrow>
        <CardTitle>登录后台</CardTitle>
        <CardDescription>
          请输入管理员账号与密码，进入当前租户的项目管理工作区。
        </CardDescription>
      </CardHeader>

      <StyledForm
        layout="vertical"
        requiredMark={false}
        colon={false}
        onFinish={handleFinish}
      >
        {props.errorMessage && (
          <WarningBanner role="alert">{props.errorMessage}</WarningBanner>
        )}

        <Form.Item
          label="登录账号"
          name="username"
          rules={[{ required: true, message: '请输入账号' }]}
        >
          <Input
            size="large"
            placeholder="请输入登录账号"
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          label="登录密码"
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            size="large"
            placeholder="请输入登录密码"
            autoComplete="current-password"
          />
        </Form.Item>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Button type="link" size="small" onClick={props.onOpenForgot}>
            忘记密码
          </Button>
          <Button type="link" size="small" onClick={props.onOpenRegister}>
            没有账号？立即注册
          </Button>
        </div>

        <Form.Item>
          <StyledSubmitButton
            type="primary"
            htmlType="submit"
            loading={props.loading}
            block
          >
            确认登录
          </StyledSubmitButton>
        </Form.Item>
      </StyledForm>
    </CardWrapper>
  );
}

export default LoginMainCard;
