import styled, { css, keyframes } from 'styled-components';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const motionReduce = css`
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
    transform: none;
  }
`;

/**
 * 登录页使用局部设计变量，避免影响后台其他页面的主题样式。
 */
export const LoginViewport = styled.div`
  --login-bg: #050816;
  --login-bg-secondary: #0b1220;
  --login-surface: rgba(10, 18, 35, 0.72);
  --login-surface-strong: rgba(9, 16, 32, 0.9);
  --login-border: rgba(120, 163, 214, 0.2);
  --login-border-strong: rgba(99, 230, 255, 0.38);
  --login-primary: #63e6ff;
  --login-secondary: #4c7bff;
  --login-text: #f3f7ff;
  --login-text-secondary: #8ba3c7;
  --login-warning-bg: rgba(109, 48, 28, 0.72);
  --login-warning-border: rgba(255, 168, 77, 0.48);
  --login-shadow: 0 24px 80px rgba(2, 8, 23, 0.45);

  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(76, 123, 255, 0.16), transparent 32%),
    radial-gradient(circle at bottom right, rgba(99, 230, 255, 0.12), transparent 30%),
    linear-gradient(135deg, var(--login-bg) 0%, var(--login-bg-secondary) 100%);
  color: var(--login-text);
  color-scheme: dark;
  font-family:
    'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial,
    sans-serif;

  @media (max-width: 1023px) {
    background:
      radial-gradient(circle at top, rgba(76, 123, 255, 0.16), transparent 28%),
      linear-gradient(180deg, var(--login-bg-secondary) 0%, var(--login-bg) 100%);
  }

  ${motionReduce}
`;

/**
 * 大面积环境辉光只负责营造空间感，不承载可交互信息。
 */
export const SurfaceGlow = styled.div`
  position: absolute;
  top: -180px;
  left: -120px;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(76, 123, 255, 0.24) 0%,
    rgba(76, 123, 255, 0.08) 34%,
    transparent 72%
  );
  filter: blur(14px);
  pointer-events: none;

  @media (max-width: 1023px) {
    display: none;
  }
`;

export const OrbitGlow = styled.div`
  position: absolute;
  right: 8%;
  bottom: -220px;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(99, 230, 255, 0.22) 0%,
    rgba(99, 230, 255, 0.08) 36%,
    transparent 74%
  );
  filter: blur(18px);
  pointer-events: none;

  @media (max-width: 1023px) {
    display: none;
  }
`;

export const GridDecoration = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.68) 0%,
    rgba(0, 0, 0, 0.24) 50%,
    rgba(0, 0, 0, 0.78) 100%
  );
  pointer-events: none;

  @media (max-width: 1023px) {
    display: none;
  }
`;

export const PageShell = styled.div`
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 48px 56px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 1199px) {
    padding: 40px 32px;
  }

  @media (max-width: 1023px) {
    padding: 28px 20px;
  }
`;

/**
 * 主布局在宽屏下保持双栏，在小桌面窗口收敛为单卡模式。
 */
export const SectionGrid = styled.div`
  width: min(1320px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(420px, 520px);
  gap: 56px;
  align-items: stretch;

  @media (max-width: 1199px) {
    grid-template-columns: minmax(0, 1fr) minmax(380px, 460px);
    gap: 32px;
  }

  @media (max-width: 1023px) {
    width: min(520px, 100%);
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
`;

export const HeroPanel = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  padding: 48px 0;
  animation: ${fadeInUp} 0.72s ease-out both;

  @media (max-width: 1023px) {
    display: none;
  }

  ${motionReduce}
`;

export const BrandBlock = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background: rgba(7, 14, 28, 0.48);
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
`;

export const BrandLogo = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(76, 123, 255, 0.2));
`;

export const BrandCaption = styled.div`
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.22em;
  color: rgba(139, 163, 199, 0.92);
  font-family:
    'SFMono-Regular', 'SF Mono', 'Fira Code', 'Roboto Mono', Consolas,
    'Liberation Mono', monospace;
`;

export const BrandTitle = styled.div`
  margin-top: 4px;
  font-size: 24px;
  line-height: 32px;
  font-weight: 700;
  color: var(--login-text);
`;

export const HeroEyebrow = styled.div`
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.28em;
  color: var(--login-primary);
  font-family:
    'SFMono-Regular', 'SF Mono', 'Fira Code', 'Roboto Mono', Consolas,
    'Liberation Mono', monospace;
`;

export const HeroTitle = styled.h1`
  margin: 0;
  max-width: 620px;
  font-size: 48px;
  line-height: 1.16;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-wrap: balance;

  @media (max-width: 1199px) {
    font-size: 40px;
  }
`;

export const HeroDescription = styled.p`
  margin: 0;
  max-width: 620px;
  font-size: 18px;
  line-height: 1.8;
  color: var(--login-text-secondary);
`;

export const CapabilityList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  max-width: 620px;
`;

export const CapabilityChip = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(99, 230, 255, 0.18);
  background: linear-gradient(
    135deg,
    rgba(10, 18, 35, 0.88) 0%,
    rgba(16, 28, 52, 0.74) 100%
  );
  color: var(--login-text);
  font-size: 14px;
  line-height: 20px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
`;
