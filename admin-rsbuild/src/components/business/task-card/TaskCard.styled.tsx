import { Alert, Card, Space, Typography } from 'antd';
import styled from 'styled-components';

function resolveTaskCardShadow(isOverlay: boolean, disabled: boolean) {
  if (isOverlay) {
    return '0 16px 30px rgba(15, 23, 42, 0.14)';
  }

  if (disabled) {
    return '0 6px 14px rgba(15, 23, 42, 0.08)';
  }

  return '0 6px 14px rgba(15, 23, 42, 0.08)';
}

function resolveTaskCardCursor(isOverlay: boolean, disabled: boolean) {
  if (isOverlay) {
    return 'default';
  }

  if (disabled) {
    return 'default';
  }

  return 'pointer';
}

function resolveTaskCardPadding(isCompact: boolean, isSubtask: boolean) {
  if (isCompact || isSubtask) {
    return 12;
  }

  return 16;
}

function resolveTitleFontSize(isCompact: boolean, isSubtask: boolean) {
  if (isCompact || isSubtask) {
    return 14;
  }

  return 15;
}

function resolveTitleLineHeight(isCompact: boolean, isSubtask: boolean) {
  if (isCompact || isSubtask) {
    return '20px';
  }

  return '22px';
}

function resolveTitleMinHeight(
  isCompact: boolean,
  isSubtask: boolean,
  isCompletedSubtask: boolean,
) {
  if (isCompletedSubtask) {
    return 20;
  }

  if (isCompact || isSubtask) {
    return 40;
  }

  return 44;
}

/**
 * 任务卡片根节点。
 */
export const TaskCardRoot = styled.div`
  width: 100%;
`;

/**
 * 任务卡片主体容器。
 */
export const TaskCardContainer = styled(Card)<{
  $isOverlay: boolean;
  $disabled: boolean;
  $compact: boolean;
  $isSubtask: boolean;
}>`
  width: 100%;
  box-shadow: ${(props) =>
    resolveTaskCardShadow(props.$isOverlay, props.$disabled)};
  cursor: ${(props) =>
    resolveTaskCardCursor(props.$isOverlay, props.$disabled)};
  transition: box-shadow 0.2s ease;

  .ant-card-body {
    padding: ${(props) =>
      resolveTaskCardPadding(props.$compact, props.$isSubtask)}px;
  }
`;

/**
 * 任务卡片信息排列容器。
 */
export const TaskCardStack = styled(Space)`
  width: 100%;
`;

/**
 * 任务动态告警条。
 *
 * Alert 没有 size 属性，因此这里仅补最小样式把它压缩成单行提示条。
 */
export const TaskDynamicAlert = styled(Alert)`
  border: 1px solid #ffd591;
  border-radius: 8px;
  background: #fff7e6;
  padding: 6px 10px;

  .ant-alert-content {
    min-width: 0;
  }

  .ant-alert-message {
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    color: #ad4e00;
    margin-bottom: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

/**
 * 任务卡片头部区域。
 */
export const TaskCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
`;

/**
 * 任务编号展示文案。
 */
export const TaskNumberLink = styled(Typography.Link)`
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'SFMono-Regular', 'Cascadia Code', 'JetBrains Mono', monospace;
  text-decoration: underline;
  cursor: copy;
`;

/**
 * 任务卡片头部辅助文案。
 */
export const TaskHeaderText = styled(Typography.Text)`
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * 任务标题文案。
 */
export const TaskTitleText = styled(Typography.Text)<{
  $compact: boolean;
  $isSubtask: boolean;
  $isCompletedSubtask: boolean;
}>`
  display: -webkit-box;
  min-height: ${(props) =>
    resolveTitleMinHeight(
      props.$compact,
      props.$isSubtask,
      props.$isCompletedSubtask,
    )}px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${(props) => {
    if (props.$isCompletedSubtask) {
      return 1;
    }

    return 2;
  }};
  font-size: ${(props) =>
    resolveTitleFontSize(props.$compact, props.$isSubtask)}px;
  line-height: ${(props) =>
    resolveTitleLineHeight(props.$compact, props.$isSubtask)};
  white-space: ${(props) => {
    if (props.$isCompletedSubtask) {
      return 'nowrap';
    }

    return 'normal';
  }};
  word-break: ${(props) => {
    if (props.$isCompletedSubtask) {
      return 'normal';
    }

    return 'break-word';
  }};
  text-decoration: ${(props) => {
    if (props.$isCompletedSubtask) {
      return 'line-through';
    }

    return 'none';
  }};
`;

/**
 * 任务卡片信息列表。
 */
export const TaskMetaList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/**
 * 任务卡片信息文案。
 */
export const TaskMetaText = styled(Typography.Text)`
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * 任务卡片标签容器。
 */
export const TaskPrioritySlot = styled.div`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
`;
