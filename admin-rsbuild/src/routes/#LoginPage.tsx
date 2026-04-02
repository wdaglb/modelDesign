import { Form, Input } from 'antd';

import logo from '@/assets/svg/logo.svg';

import {
  BrandBlock,
  BrandCaption,
  BrandLogo,
  BrandTitle,
  CapabilityChip,
  CapabilityList,
  GridDecoration,
  HeroDescription,
  HeroEyebrow,
  HeroPanel,
  HeroTitle,
  LoginViewport,
  OrbitGlow,
  PageShell,
  SectionGrid,
  SurfaceGlow,
} from './#login.styled.tsx';
import {
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
  CardWrapper,
  FooterHint,
  FormHint,
  StyledForm,
  StyledSubmitButton,
  WarningBanner,
} from './#login-form.styled.tsx';

export interface LoginFormValues {
  username: string;
  password: string;
}

interface LoginPageProps {
  loading: boolean;
  errorMessage?: string;
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
}

const capabilityList = ['多租户隔离', '权限安全接入', '模型与项目协作'];

/**
 * 登录页只承载展示层与表单交互，不介入登录成功后的业务跳转。
 */
function LoginPage(props: LoginPageProps) {
  const brandTitle = process.env.TITLE || '项目管理工具';

  return (
    <LoginViewport>
      <SurfaceGlow aria-hidden="true" />
      <OrbitGlow aria-hidden="true" />
      <GridDecoration aria-hidden="true" />
      <PageShell>
        <SectionGrid>
          <HeroPanel>
            <BrandBlock>
              <BrandLogo src={logo} alt={'系统标志'} />
              <div>
                <BrandCaption>MODEL CONTROL CENTER</BrandCaption>
                <BrandTitle>{brandTitle}</BrandTitle>
              </div>
            </BrandBlock>
            <HeroEyebrow>SECURE ACCESS</HeroEyebrow>
            <HeroTitle>面向多租户场景的项目管理工具</HeroTitle>
            <HeroDescription>
              多租户模型设计与协作控制台
              <br />
              统一管理权限、模型资产与项目协同流程。
            </HeroDescription>
            <CapabilityList>
              {capabilityList.map((item) => {
                return <CapabilityChip key={item}>{item}</CapabilityChip>;
              })}
            </CapabilityList>
          </HeroPanel>

          <CardWrapper>
            <CardHeader>
              <CardEyebrow>AUTHENTICATION</CardEyebrow>
              <CardTitle>登录后台</CardTitle>
              <CardDescription>
                请输入管理员账号与密码，进入当前租户的项目管理工作区。
              </CardDescription>
            </CardHeader>

            <StyledForm
              layout={'vertical'}
              requiredMark={false}
              colon={false}
              onFinish={props.onSubmit}
            >
              {renderWarningBanner(props.errorMessage)}

              <Form.Item
                label={'登录账号'}
                name={'username'}
                rules={[{ required: true, message: '请输入账号' }]}
              >
                <Input
                  size={'large'}
                  placeholder={'请输入登录账号'}
                  autoComplete={'username'}
                />
              </Form.Item>

              <Form.Item
                label={'登录密码'}
                name={'password'}
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  size={'large'}
                  placeholder={'请输入登录密码'}
                  autoComplete={'current-password'}
                />
              </Form.Item>

              <Form.Item>
                <StyledSubmitButton
                  type={'primary'}
                  htmlType={'submit'}
                  loading={props.loading}
                  block
                >
                  确认登录
                </StyledSubmitButton>
              </Form.Item>
            </StyledForm>

            {/*<FooterHint>*/}
            {/*  通过高对比深色界面和明确的焦点反馈，确保暗色环境下的稳定操作体验。*/}
            {/*</FooterHint>*/}
          </CardWrapper>
        </SectionGrid>
      </PageShell>
    </LoginViewport>
  );
}

function renderWarningBanner(errorMessage?: string) {
  if (!errorMessage) {
    return null;
  }

  return <WarningBanner role={'alert'}>{errorMessage}</WarningBanner>;
}

export default LoginPage;
