import styled from 'styled-components';

interface TaskCardShellProps {
  $accentColor?: string;
  $disabled: boolean;
  $isOverlay?: boolean;
  $opacity: number;
}

/**
 * 解析看板卡片边框颜色。
 *
 * 约束说明：
 * - 默认卡片使用轻度强调，保持白底主语义；
 * - 拖拽浮层略微增强强调；
 * - 禁用态弱化强调，避免与“不可操作”状态冲突。
 */
function resolveTaskCardBorderColor(props: TaskCardShellProps) {
  const accentColor = props.$accentColor;

  if (!accentColor) {
    return 'transparent';
  }

  if (props.$disabled) {
    return `${accentColor}26`;
  }

  if (props.$isOverlay) {
    return `${accentColor}66`;
  }

  return `${accentColor}4d`;
}

/**
 * 解析看板卡片外层阴影。
 *
 * 说明：
 * - 壳层阴影只负责补充状态染色，不替代通用 TaskCard 的基础阴影；
 * - 浮层态提升纵深感，但不额外放大透明度处理。
 */
function resolveTaskCardShellShadow(props: TaskCardShellProps) {
  const accentColor = props.$accentColor;

  if (!accentColor) {
    return 'none';
  }

  if (props.$disabled) {
    return `0 8px 18px ${accentColor}12`;
  }

  if (props.$isOverlay) {
    return `0 18px 32px ${accentColor}26`;
  }

  return `0 10px 24px ${accentColor}18`;
}

/**
 * 看板卡片容器。
 */
export const TaskCardShell = styled.div<TaskCardShellProps>`
  width: 100%;
  opacity: ${(props) => props.$opacity};
  border: 1px solid ${(props) => resolveTaskCardBorderColor(props)};
  border-radius: 12px;
  box-shadow: ${(props) => resolveTaskCardShellShadow(props)};
  background: #ffffff;
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
`;

/**
 * 拖拽浮层卡片容器。
 */
export const OverlayTaskCardShell = styled(TaskCardShell)`
  width: 248px;
`;
