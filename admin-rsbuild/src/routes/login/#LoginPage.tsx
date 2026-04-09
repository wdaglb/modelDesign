import { useCallback, useState } from 'react';

import logo from '@/assets/svg/logo.svg';

import {
  BrandBlock,
  BrandCaption,
  BrandLogo,
  BrandTitle,
  CapabilityChip,
  CapabilityList,
  HeroDescription,
  HeroEyebrow,
  HeroPanel,
  HeroTitle,
} from './#login.styled';
import LoginBackground from './#Login-Background';
import LoginMainCard, { type LoginFormValues } from './#LoginMainCard';
import LoginQRScan from './#Login-QRScan';
import LoginSkeleton from './#Login-Skeleton';
import LoginRegisterModal from './#Login-RegisterModal';
import LoginForgotPasswordModal from './#Login-ForgotPasswordModal';
import type { PanelType, TransitionState } from './index';

export type { LoginFormValues };

/**
 * 注册提交参数。
 */
export interface RegisterSubmitValues {
  /**
   * 用户昵称。
   */
  nickname: string;

  /**
   * 用户名。
   */
  username: string;

  /**
   * 租户 ID。
   */
  tenantId: number;

  /**
   * 注册密码。
   */
  password: string;
}

interface LoginPageProps {
  activePanel: PanelType;
  transitionState: TransitionState;
  loading: boolean;
  registerLoading: boolean;
  errorMessage?: string;
  onSubmit: (values: LoginFormValues) => Promise<void> | void;
  onRegisterSubmit: (values: RegisterSubmitValues) => Promise<void> | void;
  onSwitchPanel: (target: PanelType) => void;
  onTransitionEnd: () => void;
  onSkeletonReady: () => void;
}

const CAPABILITY_LIST = ['多租户隔离', '权限安全接入', '模型与项目协作'];

/** 登录页面编排：品牌区 + 背景层 + 当前 panel + 弹窗 */
function LoginPage(props: LoginPageProps) {
  const brandTitle = process.env.TITLE || '项目管理工具';

  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleOpenRegister = useCallback(() => {
    setRegisterOpen(true);
  }, []);

  const handleOpenForgot = useCallback(() => {
    setForgotPasswordOpen(true);
  }, []);

  const heroPanel = (
    <HeroPanel>
      <BrandBlock>
        <BrandLogo src={logo} alt="系统标志" />
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
        {CAPABILITY_LIST.map((item) => {
          return <CapabilityChip key={item}>{item}</CapabilityChip>;
        })}
      </CapabilityList>
    </HeroPanel>
  );

  /** 根据 activePanel 渲染当前面板 */
  const renderPanel = () => {
    if (props.activePanel === 'skeleton') {
      return <LoginSkeleton onReady={props.onSkeletonReady} />;
    }

    if (props.activePanel === 'qrScan') {
      return (
        <LoginQRScan
          onSwitchToPassword={() => {
            props.onSwitchPanel('password');
          }}
          onLoginSuccess={() => {
            props.onSwitchPanel('skeleton');
          }}
        />
      );
    }

    return (
      <LoginMainCard
        loading={props.loading}
        errorMessage={props.errorMessage}
        onSubmit={props.onSubmit}
        onOpenRegister={handleOpenRegister}
        onOpenForgot={handleOpenForgot}
        onSwitchToQR={() => {
          props.onSwitchPanel('qrScan');
        }}
      />
    );
  };

  return (
    <>
      <LoginBackground
        heroPanel={heroPanel}
        transitionState={props.transitionState}
        onTransitionEnd={props.onTransitionEnd}
      >
        {renderPanel()}
      </LoginBackground>

      <LoginRegisterModal
        open={registerOpen}
        loading={props.registerLoading}
        onClose={() => {
          setRegisterOpen(false);
        }}
        onSubmit={props.onRegisterSubmit}
      />

      <LoginForgotPasswordModal
        open={forgotPasswordOpen}
        onClose={() => {
          setForgotPasswordOpen(false);
        }}
      />
    </>
  );
}

export default LoginPage;
