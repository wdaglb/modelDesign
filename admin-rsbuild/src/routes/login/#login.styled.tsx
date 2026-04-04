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
 * 登录页面全局容器
 * 定义浅色科技风 CSS 变量与背景渐变
 */
export const LoginViewport = styled.div`
  --login-bg: #f5f8ff;
  --login-bg-secondary: #edf2ff;
  --login-surface: rgba(255, 255, 255, 0.92);
  --login-surface-strong: rgba(255, 255, 255, 0.96);
  --login-border: rgba(59, 107, 255, 0.12);
  --login-border-strong: rgba(59, 107, 255, 0.28);
  --login-primary: #3b6bff;
  --login-secondary: #6c8cff;
  --login-text: #111a33;
  --login-text-secondary: #5a6b9a;
  --login-warning-bg: #fff4ec;
  --login-warning-border: #ffd4b8;
  --login-shadow: 0 24px 80px rgba(17, 26, 51, 0.08);

  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 0 0, rgba(59, 107, 255, 0.08) 0%, transparent 34%),
    radial-gradient(circle at 100% 100%, rgba(108, 140, 255, 0.06) 0%, transparent 30%),
    linear-gradient(135deg, var(--login-bg) 0%, var(--login-bg-secondary) 100%);
  color: var(--login-text);
  font-family:
    'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial,
    sans-serif;

  ${motionReduce}
`;

/** 左上角柔和光晕装饰 */
export const SurfaceGlow = styled.div`
  position: absolute;
  top: -180px;
  left: -120px;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(59, 107, 255, 0.12) 0%,
    rgba(59, 107, 255, 0.04) 34%,
    transparent 72%
  );
  filter: blur(14px);
  pointer-events: none;
`;

/** 右下角柔和光晕装饰 */
export const OrbitGlow = styled.div`
  position: absolute;
  right: 8%;
  bottom: -220px;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(108, 140, 255, 0.1) 0%,
    rgba(108, 140, 255, 0.04) 36%,
    transparent 74%
  );
  filter: blur(18px);
  pointer-events: none;
`;

/** 背景网格装饰层 */
export const GridDecoration = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 107, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 107, 255, 0.04) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.5) 0%,
    rgba(0, 0, 0, 0.15) 50%,
    rgba(0, 0, 0, 0.55) 100%
  );
  pointer-events: none;
`;

/** 页面主体布局壳 */
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
`;

/** 左右分栏网格布局 */
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
`;

/** 左侧品牌与标语区域 */
export const HeroPanel = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  padding: 48px 0;
  animation: ${fadeInUp} 0.72s ease-out both;

  ${motionReduce}
`;

/** 品牌标识卡片 */
export const BrandBlock = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  width: fit-content;
  border: 1px solid rgba(59, 107, 255, 0.1);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 30px rgba(17, 26, 51, 0.06);
`;

/** 品牌 Logo 图片 */
export const BrandLogo = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
`;

/** 品牌副标题文字 */
export const BrandCaption = styled.div`
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.22em;
  color: var(--login-text-secondary);
  font-family:
    'SFMono-Regular', 'SF Mono', 'Fira Code', 'Roboto Mono', Consolas,
    'Liberation Mono', monospace;
`;

/** 品牌主标题 */
export const BrandTitle = styled.div`
  margin-top: 4px;
  font-size: 24px;
  line-height: 32px;
  font-weight: 700;
  color: var(--login-text);
`;

/** Hero 区域眉标 */
export const HeroEyebrow = styled.div`
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.28em;
  color: var(--login-primary);
  font-family:
    'SFMono-Regular', 'SF Mono', 'Fira Code', 'Roboto Mono', Consolas,
    'Liberation Mono', monospace;
`;

/** Hero 大标题 */
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

/** Hero 描述文案 */
export const HeroDescription = styled.p`
  margin: 0;
  max-width: 620px;
  font-size: 18px;
  line-height: 1.8;
  color: var(--login-text-secondary);
`;

/** 能力标签列表 */
export const CapabilityList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  max-width: 620px;
`;

/** 能力标签单体 */
export const CapabilityChip = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(59, 107, 255, 0.12);
  background: rgba(255, 255, 255, 0.7);
  color: var(--login-text);
  font-size: 14px;
  line-height: 20px;
  backdrop-filter: blur(8px);
`;
