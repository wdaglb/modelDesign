import { Badge, Card, Typography } from 'antd';
import styled from 'styled-components';

function resolveColumnBorder(accentColor: string, isOver: boolean) {
  if (isOver) {
    return `1px solid ${accentColor}`;
  }
  return '1px solid rgba(15, 23, 42, 0.08)';
}

function resolveColumnShadow(accentColor: string, isOver: boolean) {
  if (isOver) {
    return `0 18px 36px ${accentColor}22`;
  }
  return '0 10px 24px rgba(15, 23, 42, 0.06)';
}

/**
 * 列外层容器。
 */
export const ColumnFrame = styled.div`
  min-width: 280px;
  width: 280px;
  height: 100%;
  min-height: 0;
  padding: 2px;
  transition: all 0.2s ease;
`;

/**
 * 列卡片主体。
 */
export const ColumnSurface = styled(Card)<{
  $accentColor: string;
  $background: string;
  $isOver: boolean;
}>`
  height: 100%;
  min-height: 0;
  border-radius: 20px;
  background: ${(props) => props.$background};
  border: ${(props) => resolveColumnBorder(props.$accentColor, props.$isOver)};
  box-shadow: ${(props) => resolveColumnShadow(props.$accentColor, props.$isOver)};
  overflow: hidden;

  .ant-card-head {
    min-height: 0;
    padding: 16px 16px 10px;
    border-bottom: none;
  }

  .ant-card-body {
    height: calc(100% - 72px);
    min-height: 0;
    padding: 0 12px 8px 12px;
    display: flex;
    flex-direction: column;
  }
`;

/**
 * 列标题区域。
 */
export const ColumnHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
`;

/**
 * 列标题主行。
 */
export const ColumnHeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

/**
 * 列标题文本。
 */
export const ColumnTitle = styled(Typography.Title)<{ $accentColor: string }>`
  margin: 0;
  color: ${(props) => props.$accentColor};
`;

/**
 * 列副标题。
 */
export const ColumnSubtitle = styled(Typography.Text)`
  font-size: 12px;
`;

/**
 * 列计数徽标。
 */
export const ColumnBadge = styled(Badge)`
  .ant-badge-count {
    box-shadow: none;
  }
`;

/**
 * 列内容区域。
 */
export const ColumnBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
`;

/**
 * 空列提示区域。
 */
export const EmptyDropZone = styled.div<{ $accentColor: string }>`
  min-height: 220px;
  border-radius: 14px;
  border: 1px dashed ${(props) => `${props.$accentColor}33`};
  background: rgba(255, 255, 255, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * 任务列表容器。
 */
export const TaskList = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

/**
 * 单个任务容器。
 */
export const TaskItem = styled.div`
  width: 100%;
`;
