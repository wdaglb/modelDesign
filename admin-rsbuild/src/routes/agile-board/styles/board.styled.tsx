import { Card } from 'antd';
import styled from 'styled-components';

/**
 * 看板页面根容器。
 */
export const BoardPageRoot = styled.div`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: #f3f5f8;
  box-sizing: border-box;
`;

/**
 * 顶部工具栏卡片。
 */
export const BoardToolbarCard = styled(Card)`
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
`;

/**
 * 看板主体卡片。
 */
export const BoardContentCard = styled(Card)`
  flex: 1;
  min-height: 0;
  border-radius: 22px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);

  .ant-card-body {
    height: 100%;
    min-height: 0;
    padding: 10px;
    background: #edf1f5;
  }
`;

/**
 * 列区域滚动容器。
 */
export const BoardColumnsScroller = styled.div`
  height: 100%;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px;
`;

/**
 * 列网格布局。
 */
export const BoardColumnsGrid = styled.div<{ $columnCount: number }>`
  display: flex;
  height: 100%;
  min-height: 0;
  gap: 16px;
  align-items: stretch;
  width: max-content;
  min-width: ${(props) => {
    const columnCount = Math.max(props.$columnCount, 1);
    return `${columnCount * 296}px`;
  }};
`;
