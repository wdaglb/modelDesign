import { Card } from 'antd';
import styled from 'styled-components';

/**
 * 用户管理页面外层容器。
 */
export const PageShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/**
 * 头部卡片。
 */
export const HeaderCard = styled(Card)`
  border-radius: 16px;
  border-color: #e9edf5;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);

  .ant-card-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }
`;

/**
 * 标题区。
 */
export const HeaderTextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

/**
 * 筛选面板。
 */
export const FilterCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/**
 * 高级筛选表单栅格。
 */
export const AdvancedFilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 12px;
`;
