import { Alert, Card, Space, Tag, Typography } from 'antd';
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

/**
 * 解析任务卡片主体内边距。
 *
 * 说明：
 * - 当前需求只增大卡片“顶部”留白，让顶部告警、编号和优先级区域更透气；
 * - 左右与底部尽量沿用原节奏，避免同时放大整张卡片高度；
 * - 紧凑态与子任务态也保留同样的顶部增强，但增幅比默认态更克制。
 *
 * @param isCompact 是否紧凑态
 * @param isSubtask 是否子任务态
 * @returns CSS padding 字符串
 */
function resolveTaskCardPadding(isCompact: boolean, isSubtask: boolean) {
  if (isCompact || isSubtask) {
    return '14px 12px 12px';
  }

  return '20px 16px 16px';
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
      resolveTaskCardPadding(props.$compact, props.$isSubtask)};
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
 * 任务卡片中的建议分支名文案。
 */
export const TaskBranchText = styled(Typography.Text)`
  display: block;
  min-width: 0;
  font-size: 11px;
  line-height: 16px;
  color: rgba(15, 23, 42, 0.62);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'SFMono-Regular', 'Cascadia Code', 'JetBrains Mono', monospace;
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
 * 任务标题行。
 *
 * 类型标签和标题共用同一行，避免标签插入后破坏卡片其它信息区域的垂直节奏。
 */
export const TaskTitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  min-width: 0;
`;

/**
 * 任务类型标签。
 *
 * 标签尺寸收敛到卡片标题行节奏内，避免在紧凑态里把两行标题挤成三行。
 */
export const TaskTypeTag = styled(Tag)<{
  $background: string;
  $borderColor: string;
  $textColor: string;
}>`
  margin-inline-end: 0;
  margin-top: 1px;
  flex-shrink: 0;
  border-radius: 999px;
  border-color: ${(props) => props.$borderColor};
  background: ${(props) => props.$background};
  color: ${(props) => props.$textColor};
  font-size: 12px;
  line-height: 18px;
  padding-inline: 8px;
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
