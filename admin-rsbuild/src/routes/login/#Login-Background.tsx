import type { ReactNode } from 'react';

import {
  GridDecoration,
  LoginViewport,
  OrbitGlow,
  PageShell,
  SectionGrid,
  SurfaceGlow,
} from './#login.styled';
import LoginNeonAnimation from './#Login-NeonAnimation';
import type { TransitionState } from './index';

interface LoginBackgroundProps {
  heroPanel: ReactNode;
  children: ReactNode;
  transitionState: TransitionState;
  onTransitionEnd: () => void;
}

/** 背景包装层：左侧品牌区 + 右侧动画容器 + children slot 插入当前 panel */
function LoginBackground(props: LoginBackgroundProps) {
  /** 根据过渡状态计算透明度 */
  let panelOpacity = 1;
  if (props.transitionState === 'exiting') {
    panelOpacity = 0;
  }

  return (
    <LoginViewport>
      <SurfaceGlow aria-hidden="true" />
      <OrbitGlow aria-hidden="true" />
      <GridDecoration aria-hidden="true" />
      <PageShell>
        <SectionGrid>
          {props.heroPanel}
          <div
            onTransitionEnd={props.onTransitionEnd}
            style={{
              opacity: panelOpacity,
              transition: 'opacity 300ms ease',
            }}
          >
            <LoginNeonAnimation />
            {props.children}
          </div>
        </SectionGrid>
      </PageShell>
    </LoginViewport>
  );
}

export default LoginBackground;
