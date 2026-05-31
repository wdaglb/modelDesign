import { Card, Tag, Typography } from 'antd';
import styled from 'styled-components';

/**
 * v2 看板页面根容器。
 */
export const V2BoardPageRoot = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 32%),
    radial-gradient(circle at top right, rgba(16, 185, 129, 0.06), transparent 28%),
    #f4f7fb;
`;

/**
 * v2 工具栏卡片。
 */
export const V2BoardToolbarCard = styled(Card)`
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(12px);
`;

/**
 * v2 看板主体卡片。
 */
export const V2BoardContentCard = styled(Card)`
  flex: 1;
  min-height: 0;
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
  overflow: hidden;

  .ant-card-body {
    height: 100%;
    min-height: 0;
    padding: 12px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(244, 247, 251, 0.96));
  }
`;

/**
 * 横向列滚动容器。
 */
export const V2BoardColumnsScroller = styled.div`
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
  scrollbar-gutter: stable both-edges;
`;

/**
 * v2 列网格。
 */
export const V2BoardColumnsGrid = styled.div<{ $columnCount: number }>`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(300px, 300px);
  gap: 16px;
  align-items: stretch;
  height: 100%;
  min-height: 0;
  width: max-content;
  min-width: ${(props) => {
    const columnCount = Math.max(props.$columnCount, 1);
    return `${columnCount * 316}px`;
  }};
`;

/**
 * v2 单列容器。
 */
export const V2ColumnFrame = styled.section<{
  $accentColor: string;
  $isOver?: boolean;
}>`
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 22px;
  background: ${(props) => {
    if (props.$isOver) {
      return `${props.$accentColor}14`;
    }

    return 'rgba(255, 255, 255, 0.75)';
  }};
  border: 1px solid ${(props) => {
    if (props.$isOver) {
      return `${props.$accentColor}66`;
    }

    return 'rgba(15, 23, 42, 0.06)';
  }};
  box-shadow: ${(props) => {
    if (props.$isOver) {
      return `0 0 0 3px ${props.$accentColor}18 inset`;
    }

    return 'inset 0 1px 0 rgba(255, 255, 255, 0.8)';
  }};
  overflow: hidden;
  contain: content;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
`;

/**
 * v2 列头。
 */
export const V2ColumnHeader = styled.header<{ $accentColor: string }>`
  padding: 14px 14px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  background:
    linear-gradient(
      180deg,
      ${(props) => `${props.$accentColor}14`},
      rgba(255, 255, 255, 0.72)
    );
`;

/**
 * v2 列头主行。
 */
export const V2ColumnHeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

/**
 * v2 列标题。
 */
export const V2ColumnTitle = styled(Typography.Title)<{ $accentColor: string }>`
  margin: 0;
  font-size: 16px !important;
  line-height: 24px !important;
  color: ${(props) => props.$accentColor};
`;

/**
 * v2 列副标题。
 */
export const V2ColumnSubtitle = styled(Typography.Text)`
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(71, 85, 105, 0.9);
`;

/**
 * v2 数量标签。
 */
export const V2ColumnCountTag = styled(Tag)<{ $accentColor: string }>`
  margin-inline-end: 0;
  border-radius: 999px;
  padding-inline: 10px;
  color: ${(props) => props.$accentColor};
  background: ${(props) => `${props.$accentColor}14`};
  border-color: ${(props) => `${props.$accentColor}22`};
`;

/**
 * v2 列内容区域。
 *
 * 固定把底部留白放进真实滚动容器，确保最后一张卡片能完整滚出。
 */
export const V2ColumnBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 8px 14px;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-gutter: stable;
`;

/**
 * v2 卡片列表。
 */
export const V2TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/**
 * v2 单卡容器。
 */
export const V2TaskCard = styled.button<{
  $accentColor: string;
  $isDragging?: boolean;
  $isOverlay?: boolean;
}>`
  width: 100%;
  min-height: 108px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-top: 3px solid ${(props) => props.$accentColor};
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff, #f8fbff);
  box-shadow: ${(props) => {
    if (props.$isOverlay) {
      return '0 18px 38px rgba(15, 23, 42, 0.16)';
    }

    return '0 10px 24px rgba(15, 23, 42, 0.06)';
  }};
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: ${(props) => {
    if (props.$isDragging) {
      return 0;
    }

    return 1;
  }};
  cursor: pointer;
  touch-action: none;
  transition:
    opacity 0.12s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    transform: ${(props) => {
      if (props.$isOverlay) {
        return 'none';
      }

      return 'translateY(-2px)';
    }};
    box-shadow: ${(props) => {
      if (props.$isOverlay) {
        return '0 18px 38px rgba(15, 23, 42, 0.16)';
      }

      return '0 16px 32px rgba(15, 23, 42, 0.1)';
    }};
    border-color: ${(props) => `${props.$accentColor}55`};
  }
`;

/**
 * v2 卡片首行。
 */
export const V2TaskCardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

/**
 * v2 任务编号。
 */
export const V2TaskCode = styled(Typography.Text)<{ $accentColor: string }>`
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => props.$accentColor};
`;

/**
 * v2 优先级标签。
 */
export const V2PriorityTag = styled.span<{ $color: string }>`
  flex: 0 0 auto;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 16px;
  color: ${(props) => props.$color};
  background: ${(props) => `${props.$color}14`};
`;

/**
 * v2 任务标题。
 */
export const V2TaskTitle = styled(Typography.Title)`
  margin: 0 !important;
  font-size: 14px !important;
  line-height: 20px !important;
  color: #0f172a;
`;

/**
 * v2 标题行。
 */
export const V2TaskTitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
`;

/**
 * v2 任务类型标签。
 */
export const V2TaskTypeTag = styled.span`
  flex: 0 0 auto;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
`;

/**
 * v2 任务描述摘要。
 */
export const V2TaskSummary = styled(Typography.Paragraph)`
  margin: 0 !important;
  color: #475569;
  font-size: 12px;
  line-height: 18px;
  min-height: 36px;
`;

/**
 * v2 卡片元信息网格。
 */
export const V2TaskMetaGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
`;

/**
 * v2 元信息块。
 */
export const V2TaskMetaItem = styled.div`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-width: 0;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.95);
`;

/**
 * v2 元信息标签。
 */
export const V2TaskMetaLabel = styled.div`
  font-size: 11px;
  line-height: 14px;
  color: #64748b;
`;

/**
 * v2 元信息值。
 */
export const V2TaskMetaValue = styled.div`
  font-size: 12px;
  line-height: 14px;
  color: #0f172a;
  word-break: break-word;
`;

/**
 * v2 子任务入口。
 */
export const V2TaskSubtaskButton = styled.button<{ $accentColor: string }>`
  align-self: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  color: ${(props) => props.$accentColor};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
`;

/**
 * v2 空状态。
 */
export const V2EmptyState = styled.div<{ $accentColor: string }>`
  min-height: 180px;
  border-radius: 18px;
  border: 1px dashed ${(props) => `${props.$accentColor}33`};
  background: rgba(248, 250, 252, 0.84);
  display: flex;
  align-items: center;
  justify-content: center;
`;
