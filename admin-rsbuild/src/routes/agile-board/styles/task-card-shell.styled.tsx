import styled from 'styled-components';

/**
 * 看板卡片容器。
 */
export const TaskCardShell = styled.div<{ $opacity: number }>`
  width: 100%;
  opacity: ${(props) => props.$opacity};
`;

/**
 * 拖拽浮层卡片容器。
 */
export const OverlayTaskCardShell = styled.div`
  width: 248px;
`;
