import styled, { keyframes, css } from 'styled-components';

/** 霓虹灯脉冲动画：透明度与水平缩放循环变化 */
const neonPulse = keyframes`
  0% {
    opacity: 0.4;
    transform: scaleX(0.6);
  }
  50% {
    opacity: 1;
    transform: scaleX(1);
  }
  100% {
    opacity: 0.4;
    transform: scaleX(0.6);
  }
`;

/** 减少动画偏好：当用户系统设置 prefers-reduced-motion 时禁用动画 */
const motionReduce = css`
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
    transform: none;
  }
`;

/** 左侧霓虹灯侧边栏容器 */
export const NeonSidebar = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 40px 0;
  pointer-events: none;
`;

/** 单条霓虹灯动画条，支持自定义颜色与延迟 */
export const NeonBar = styled.div<{ $delay: number; $color: string }>`
  flex: 1;
  border-radius: 3px;
  background: ${(props) => props.$color};
  box-shadow: 0 0 16px ${(props) => props.$color}, 0 0 32px ${(props) => props.$color};
  animation: ${neonPulse} 3s ease-in-out infinite;
  animation-delay: ${(props) => props.$delay}s;
  transform-origin: center;

  ${motionReduce}
`;

/** Panel 过渡容器：根据过渡状态控制透明度实现淡入淡出 */
export const PanelTransition = styled.div<{ $state: 'idle' | 'exiting' | 'entering' }>`
  opacity: ${(props) => {
    if (props.$state === 'exiting') {
      return 0;
    }
    if (props.$state === 'entering') {
      return 1;
    }
    return 1;
  }};
  transition: opacity 300ms ease;
`;

/** 动画容器：包裹霓虹灯与 panel 内容的定位上下文 */
export const AnimationContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;
